import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { requestOrigin } from "@/lib/auth/google";
import {
  type ExtensionAddon,
  getCreditProduct,
  getExtensionAddon,
  getPurchasable,
} from "@/lib/payments/catalog";
import { createCheckout, isCreemConfigured } from "@/lib/payments/creem";
import { getParticipant, getSession, roomOwnerId } from "@/lib/runtime/store";
import { getCurrentUser, isAuthenticated } from "@/lib/session";

/**
 * 결제 시작 — Creem 체크아웃 세션을 만들고 결제 페이지로 보냅니다.
 *
 * POST만 받습니다. 링크(GET)로 열리면 크롤러나 프리페치가 결제 세션을 만들 수
 * 있기 때문입니다.
 *
 * 파는 것은 두 가지입니다.
 *   · 매치 횟수(`CREDIT_PRODUCTS`) — 입장료·추가 매치. 입장 신청 화면에서 구매
 *   · 시간 연장(`EXTENSION_ADDONS`) — 이미 열린 방 안에서 구매
 *
 * 로그인하지 않았으면 로그인 화면으로 보내되, `next`에 돌아올 경로를 실어
 * 결제 흐름이 끊기지 않게 합니다.
 */
export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  const sessionId = String(form.get("sessionId") ?? "").trim();
  const next = safeNext(form.get("next"));

  const extension = getExtensionAddon(code);
  if (extension) {
    return startExtensionCheckout(origin, extension, sessionId);
  }

  const credit = getCreditProduct(code);
  if (!credit) {
    const known = Boolean(getPurchasable(code));
    return NextResponse.redirect(
      new URL(`${next}?error=${known ? "unavailable" : "unknown"}`, origin),
      303,
    );
  }

  // 미리보기 단계의 데모 회원이 아니라 '진짜 로그인'을 요구합니다 —
  // 결제는 계정에 귀속되어야 하기 때문입니다.
  if (!(await isAuthenticated())) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(next)}`, origin),
      303,
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", origin), 303);
  }

  if (!isCreemConfigured()) {
    return NextResponse.redirect(
      new URL(`${next}?error=not_configured`, origin),
      303,
    );
  }

  const result = await createCheckout({
    code: credit.code,
    userId: user.id,
    userEmail: user.email,
    // 결제 성공 여부는 여기서 판단하지 않습니다. 이 화면은 "확인 중" 안내만
    // 하고, 실제 지급은 웹훅이 확인한 뒤에 이루어집니다.
    successUrl: `${origin}${next}?purchase=processing`,
  });

  if (!result.ok) {
    const reason =
      result.reason === "unknown_product" ? "unavailable" : result.reason;
    return NextResponse.redirect(new URL(`${next}?error=${reason}`, origin), 303);
  }

  return NextResponse.redirect(result.checkoutUrl, 303);
}

/**
 * 결제를 마치고 돌아올 우리 쪽 경로.
 *
 * 폼에서 오는 값이므로 **우리 사이트 안의 경로만** 허용합니다. `//evil.com`은
 * 브라우저가 프로토콜 상대 URL로 읽어 외부로 나가므로 함께 막습니다.
 */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) return "/entry";
  // 쿼리·해시는 우리가 다시 붙이므로 경로만 남깁니다.
  return value.split(/[?#]/)[0];
}

/* --------------------------------------------------------------- 시간 연장 */

/**
 * 영상방 시간 연장 결제.
 *
 * 늘어나는 것은 **방 전체의 시간**이므로, 아무나 아무 방이나 늘리지 못하도록
 * 여기서 세 가지를 서버가 직접 확인합니다.
 *
 *   1. 요청자가 그 방의 활성 참가자인가
 *   2. 그 방에 늘릴 시간(이용 기록)이 실제로 있는가
 *   3. 부담자용 상품과 선물용 상품을 각자 자기 자리에서 사고 있는가
 *
 * 세션 id는 폼에서 오지만, 나중에 지급을 판정할 때 쓰는 값은 Creem이 되돌려
 * 주는 metadata입니다. 폼 값은 여기서 검증하고 그대로 metadata에 실립니다.
 */
async function startExtensionCheckout(
  origin: string,
  extension: ExtensionAddon,
  sessionId: string,
) {
  if (!sessionId) {
    return NextResponse.redirect(new URL("/lobby", origin), 303);
  }
  const back = (error: string) =>
    NextResponse.redirect(
      new URL(`/room/${sessionId}?extend_error=${error}`, origin),
      303,
    );

  if (!(await isAuthenticated())) {
    const next = `/room/${sessionId}`;
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(next)}`, origin),
      303,
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin), 303);

  // 1. 이 방의 참가자만 이 방의 시간을 살 수 있습니다.
  const participant = getParticipant(sessionId, user.id);
  if (!participant || participant.status === "removed") {
    return NextResponse.redirect(new URL("/lobby", origin), 303);
  }
  if (getSession(sessionId)?.state === "ended") return back("closed");

  // 2. 아직 영상이 시작되지 않았으면 늘릴 시간 자체가 없습니다.
  const usage = await getDb().getLoungeUsage(sessionId);
  if (!usage) return back("no_usage");
  if (usage.sessionStatus === "ended") return back("closed");

  // 3. 부담자는 '연장', 나머지 참가자는 '연장 선물'을 삽니다. 어느 쪽이든
  //    늘어나는 시간은 같지만, 안내 문구와 가격표가 서로 다릅니다.
  const buyer = roomOwnerId(sessionId) === user.id ? "payer" : "guest";
  if (extension.inRoomBuyer !== buyer) return back("unavailable");

  if (!isCreemConfigured()) return back("not_configured");

  const result = await createCheckout({
    code: extension.code,
    userId: user.id,
    userEmail: user.email,
    sessionId,
    // 결제 확인은 웹훅이 합니다. 이 화면은 "확인 중"만 알리고, 시간이 실제로
    // 늘어나는 것은 룸 폴링이 새 만료 시각을 받아올 때입니다.
    successUrl: `${origin}/room/${sessionId}?extend=processing`,
  });

  if (!result.ok) {
    return back(
      result.reason === "unknown_product" ? "unavailable" : result.reason,
    );
  }

  return NextResponse.redirect(result.checkoutUrl, 303);
}
