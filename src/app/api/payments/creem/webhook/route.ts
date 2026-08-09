import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
  getCreditProduct,
  getExtensionAddon,
  getPurchasable,
} from "@/lib/payments/catalog";
import {
  SIGNATURE_HEADER,
  isWebhookConfigured,
  parseWebhookEvent,
  readCompletedCheckout,
  readRefundedPaymentId,
  verifyWebhookSignature,
} from "@/lib/payments/creem";

/**
 * Creem 웹훅 수신 — **결제 성공의 유일한 판정 지점**입니다.
 *
 * 브라우저가 성공 URL로 돌아온 것만으로는 아무것도 지급하지 않습니다. 주소창은
 * 누구나 입력할 수 있기 때문입니다. 매치 횟수는 서명이 확인된 이 요청에서만
 * 늘어납니다.
 *
 * 멱등성: 지급은 Creem 주문 ID를 기본키로 하는 payments 테이블이 보장합니다.
 * 같은 웹훅이 재시도로 여러 번 도착해도 두 번 지급되지 않습니다.
 */
export async function POST(request: Request) {
  if (!isWebhookConfigured()) {
    // 시크릿이 없으면 검증이 불가능합니다. 받아서 무시하는 대신 명시적으로
    // 거부해, 설정 누락이 조용히 묻히지 않게 합니다.
    console.error("[payments] CREEM_WEBHOOK_SECRET 미설정 — 웹훅을 거부합니다.");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // 서명은 반드시 파싱 전 원문으로 검증합니다.
  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER);

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[payments] 웹훅 서명 검증 실패");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const event = parseWebhookEvent(rawBody);
  if (!event) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    switch (event.eventType) {
      case "checkout.completed":
        return await handleCheckoutCompleted(event);

      case "refund.created":
      case "dispute.created":
        return await handleRefund(event);

      default:
        // 구독 이벤트 등은 아직 쓰지 않습니다. 200으로 받아 Creem의 재시도를
        // 유발하지 않되, 아무것도 지급하지 않습니다.
        return NextResponse.json({ received: true, handled: false });
    }
  } catch (error) {
    console.error("[payments] 웹훅 처리 중 오류", error);
    // 500을 돌려주면 Creem이 재시도합니다. 멱등하므로 재시도는 안전합니다.
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(
  event: ReturnType<typeof parseWebhookEvent> & object,
) {
  const checkout = readCompletedCheckout(event);
  if (!checkout) {
    console.error("[payments] checkout.completed에서 주문 정보를 읽지 못했습니다.");
    return NextResponse.json({ error: "unreadable" }, { status: 400 });
  }

  if (!checkout.userId || !checkout.planCode) {
    // 우리 체크아웃을 거치지 않은 결제(대시보드 수동 결제 등)입니다.
    // 누구에게 줄지 알 수 없으므로 지급하지 않고 기록만 남깁니다.
    console.warn(
      `[payments] metadata 없는 결제 — 지급하지 않음 (order ${checkout.paymentId})`,
    );
    return NextResponse.json({ received: true, handled: false });
  }

  const item = getPurchasable(checkout.planCode);
  if (!item) {
    console.warn(`[payments] 알 수 없는 상품 코드 ${checkout.planCode}`);
    return NextResponse.json({ received: true, handled: false });
  }

  // 지급 횟수와 연장 분 수는 클라이언트가 아니라 서버 카탈로그가 정합니다.
  const credit = getCreditProduct(checkout.planCode);
  const extension = getExtensionAddon(checkout.planCode);

  // 시간 연장은 "어느 방을" 늘릴지가 있어야 이행됩니다. 세션 id는 체크아웃을
  // 만들 때 우리가 실어 보낸 metadata에서만 읽습니다.
  const extend =
    extension && checkout.sessionId
      ? { sessionId: checkout.sessionId, minutes: extension.extendMinutes }
      : null;

  if (!credit && !extend) {
    // 우리가 이행할 수 없는 결제입니다(예: Creem 대시보드에서 직접 발행한
    // 링크, 또는 세션 id가 빠진 연장 결제). 지급 없이 기록만 남기고,
    // 운영자가 관리자 화면에서 확인해 처리합니다.
    console.warn(
      `[payments] 이행할 수 없는 결제 — 수동 확인 필요 (order ${checkout.paymentId}, plan ${checkout.planCode})`,
    );
  }

  const { applied, extend: extended } = await getDb().recordPurchase({
    paymentId: checkout.paymentId,
    userId: checkout.userId,
    productId: checkout.productId,
    planCode: checkout.planCode,
    amount: checkout.amount,
    currency: checkout.currency,
    purchasedMatches: credit?.matches ?? 0,
    extend,
  });

  // 이미 닫힌 방은 늘릴 수 없습니다. 웹훅을 실패로 돌리면 Creem이 영원히
  // 재시도하므로, 받아 놓고 운영자가 환불하도록 로그로 남깁니다.
  if (extended && !extended.ok) {
    console.error(
      `[payments] 연장을 적용하지 못했습니다 — 환불 필요 (order ${checkout.paymentId}, session ${checkout.sessionId}, 사유 ${extended.reason})`,
    );
  }

  return NextResponse.json({
    received: true,
    handled: true,
    applied,
    extended: extended?.ok ?? null,
  });
}

async function handleRefund(
  event: ReturnType<typeof parseWebhookEvent> & object,
) {
  const paymentId = readRefundedPaymentId(event);
  if (!paymentId) {
    return NextResponse.json({ received: true, handled: false });
  }

  const { applied, reclaimed } = await getDb().refundPayment(paymentId);
  if (applied) {
    console.info(
      `[payments] 환불 처리 — order ${paymentId}, 방 매치 ${reclaimed}회 회수`,
    );
  }
  return NextResponse.json({ received: true, handled: true, applied, reclaimed });
}
