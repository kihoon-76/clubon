import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  PURCHASABLES,
  type Purchasable,
  getPurchasable,
} from "@/lib/payments/catalog";

/**
 * Creem 결제 연동 (REST).
 *
 * 이 앱의 다른 외부 연동(`src/lib/video/daily.ts`)과 같은 방식입니다 —
 * 공급자 SDK를 얹지 않고 문서화된 엔드포인트를 직접 호출합니다.
 *
 * 브라우저에는 API 키도 웹훅 시크릿도 내려가지 않습니다. 클라이언트가 받는
 * 것은 Creem이 발급한 결제 페이지 URL 하나뿐입니다.
 *
 * 필요한 환경 변수
 *   CREEM_API_KEY            서버 전용 API 키
 *   CREEM_WEBHOOK_SECRET     웹훅 서명 검증용 시크릿
 *   CREEM_MODE               'test' | 'live' (기본 test)
 *   CREEM_*_PRODUCT_ID       상품별 Creem 상품 ID (카탈로그의 productIdEnv)
 */

const LIVE_BASE = "https://api.creem.io/v1";
const TEST_BASE = "https://test-api.creem.io/v1";

function apiBase(): string {
  return process.env.CREEM_MODE === "live" ? LIVE_BASE : TEST_BASE;
}

export function isCreemConfigured(): boolean {
  return Boolean(process.env.CREEM_API_KEY);
}

/** 웹훅을 처리할 수 있는 상태인지. 시크릿이 없으면 검증할 수 없으므로 거부합니다. */
export function isWebhookConfigured(): boolean {
  return Boolean(process.env.CREEM_WEBHOOK_SECRET);
}

function apiKey(): string {
  const key = process.env.CREEM_API_KEY;
  if (!key) throw new Error("CREEM_API_KEY가 설정되지 않았습니다.");
  return key;
}

/**
 * 카탈로그 상품에 대응하는 Creem 상품 ID.
 *
 * 환경 변수가 비어 있으면 그 상품은 아직 Creem 대시보드에 만들어지지 않은
 * 것입니다. 임의의 ID를 지어내지 않고 null을 돌려주어, 화면에서 "준비 중"으로
 * 표시하고 결제를 시작하지 않습니다.
 */
export function productIdFor(item: Purchasable): string | null {
  return process.env[item.productIdEnv]?.trim() || null;
}

/** 지금 실제로 판매 가능한(= Creem 상품 ID가 연결된) 상품 코드 집합. */
export function purchasableCodes(): Set<string> {
  const codes = new Set<string>();
  if (!isCreemConfigured()) return codes;
  for (const item of PURCHASABLES) {
    if (productIdFor(item)) codes.add(item.code);
  }
  return codes;
}

/* ------------------------------------------------------------- 체크아웃 */

export interface CheckoutInput {
  /** 카탈로그 상품 코드 */
  code: string;
  userId: string;
  userEmail: string;
  /** 결제 완료 후 돌아올 절대 URL */
  successUrl: string;
  /**
   * 시간 연장 상품이면 늘려 줄 방의 세션 id.
   *
   * 어느 방을 늘릴지도 브라우저가 아니라 **Creem이 되돌려준 metadata**로
   * 판단합니다. 성공 URL의 쿼리스트링은 신뢰하지 않습니다.
   */
  sessionId?: string | null;
}

export type CheckoutResult =
  | { ok: true; checkoutUrl: string; checkoutId: string }
  | { ok: false; reason: "unknown_product" | "not_configured" | "creem_error" };

/**
 * Creem 체크아웃 세션을 만들고 결제 페이지 URL을 돌려줍니다.
 *
 * `metadata`에 userId와 상품 코드를 실어 보내면, 나중에 웹훅이 도착했을 때
 * "누구에게 무엇을 지급할지"를 브라우저 입력이 아니라 **Creem이 되돌려준 값**
 * 으로 판단할 수 있습니다. 프런트엔드 리다이렉트는 신뢰하지 않습니다.
 */
export async function createCheckout(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  if (!isCreemConfigured()) return { ok: false, reason: "not_configured" };

  const item = getPurchasable(input.code);
  if (!item) return { ok: false, reason: "unknown_product" };

  const productId = productIdFor(item);
  if (!productId) return { ok: false, reason: "unknown_product" };

  const res = await fetch(`${apiBase()}/checkouts`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      // 이 결제 요청을 추적할 자체 식별자.
      request_id: `${input.userId}:${item.code}:${Date.now()}`,
      success_url: input.successUrl,
      customer: { email: input.userEmail },
      metadata: {
        userId: input.userId,
        planCode: item.code,
        ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(
      `[payments] Creem 체크아웃 생성 실패 (${res.status}) ${detail.slice(0, 300)}`,
    );
    return { ok: false, reason: "creem_error" };
  }

  const data = (await res.json()) as { id?: string; checkout_url?: string };
  if (!data.checkout_url) {
    console.error("[payments] Creem 응답에 checkout_url이 없습니다.");
    return { ok: false, reason: "creem_error" };
  }

  return {
    ok: true,
    checkoutUrl: data.checkout_url,
    checkoutId: data.id ?? "",
  };
}

/* ---------------------------------------------------------------- 웹훅 */

/** Creem이 서명을 실어 보내는 헤더. */
export const SIGNATURE_HEADER = "creem-signature";

/**
 * 웹훅 서명 검증 — 원문 바디를 시크릿으로 HMAC-SHA256 한 hex와 비교합니다.
 *
 * **반드시 파싱 전 원문(raw body)으로 검증해야 합니다.** JSON.parse 후 다시
 * 문자열로 만들면 키 순서·공백이 달라져 서명이 어긋납니다.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** 처리 대상 이벤트. 나머지는 200으로 받되 아무것도 하지 않습니다. */
export type CreemEventType =
  | "checkout.completed"
  | "refund.created"
  | "dispute.created";

export interface CreemWebhookEvent {
  id: string;
  eventType: string;
  object: Record<string, unknown>;
}

export function parseWebhookEvent(rawBody: string): CreemWebhookEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    const eventType = parsed.eventType ?? parsed.event_type;
    if (typeof eventType !== "string") return null;
    return {
      id: typeof parsed.id === "string" ? parsed.id : "",
      eventType,
      object:
        typeof parsed.object === "object" && parsed.object !== null
          ? (parsed.object as Record<string, unknown>)
          : {},
    };
  } catch {
    return null;
  }
}

/* -------------------------------------------------- 웹훅 페이로드 해석 */

export interface CompletedCheckout {
  /** 지급 멱등 키로 쓸 주문 식별자 */
  paymentId: string;
  userId: string | null;
  planCode: string | null;
  /** 시간 연장 상품이면 늘려 줄 방의 세션 id */
  sessionId: string | null;
  productId: string;
  /** 최소 화폐 단위 정수 */
  amount: number;
  currency: string;
}

function pick(obj: unknown, key: string): unknown {
  if (typeof obj !== "object" || obj === null) return undefined;
  return (obj as Record<string, unknown>)[key];
}

function idOf(value: unknown): string {
  if (typeof value === "string") return value;
  const nested = pick(value, "id");
  return typeof nested === "string" ? nested : "";
}

/**
 * `checkout.completed` 페이로드에서 지급에 필요한 값만 뽑습니다.
 *
 * 금액·상품·주문 ID는 모두 Creem이 보낸 값을 씁니다. 지급 대상 회원은
 * 체크아웃 생성 때 우리가 실어 보낸 metadata.userId로 판단합니다.
 */
export function readCompletedCheckout(
  event: CreemWebhookEvent,
): CompletedCheckout | null {
  const object = event.object;
  const order = pick(object, "order");
  const metadata = pick(object, "metadata");

  // 주문 ID가 최우선. 없으면 체크아웃 ID로 대체해 멱등 키를 확보합니다.
  const paymentId = idOf(order) || idOf(pick(object, "id"));
  if (!paymentId) return null;

  const amountRaw = pick(order, "amount");
  const currencyRaw = pick(order, "currency");

  return {
    paymentId,
    userId: (pick(metadata, "userId") as string | undefined) ?? null,
    planCode: (pick(metadata, "planCode") as string | undefined) ?? null,
    sessionId: (pick(metadata, "sessionId") as string | undefined) ?? null,
    productId: idOf(pick(object, "product")),
    amount: Number(amountRaw ?? 0),
    currency: typeof currencyRaw === "string" ? currencyRaw : "USD",
  };
}

/** 환불·분쟁 이벤트에서 되돌릴 주문 ID를 찾습니다. */
export function readRefundedPaymentId(event: CreemWebhookEvent): string | null {
  const object = event.object;
  const fromOrder = idOf(pick(object, "order"));
  if (fromOrder) return fromOrder;

  const checkout = pick(object, "checkout");
  const fromCheckoutOrder = idOf(pick(checkout, "order"));
  return fromCheckoutOrder || null;
}
