/**
 * 이용권 상품 카탈로그 — 가격·혜택의 단일 출처.
 *
 * 화면(결제 페이지·마이페이지·관리자)과 서버(체크아웃·웹훅 지급)가 모두 이
 * 표만 참조합니다. 컴포넌트 안에 값을 다시 적지 마세요.
 *
 * 금액은 **USD 센트 정수**로 둡니다. 부동소수 반올림으로 결제 금액이 틀어지는
 * 일을 원천적으로 막고, Creem이 돌려주는 금액과도 같은 단위로 비교합니다.
 *
 * 실제 판매 가격은 Creem 대시보드에 만든 상품이 결정합니다. 여기 값은 화면
 * 표시와 지급 수량 계산용이며, 웹훅 처리 시 Creem이 알려준 실제 결제 금액을
 * 함께 기록해 불일치를 관리자 화면에서 확인할 수 있게 합니다.
 */

export type PlanCode = "one_time" | "light" | "gold" | "black_vip";

export type MembershipType = "standard" | "vip";

export interface PassPlan {
  code: PlanCode;
  /** 화면에 노출할 상품명 */
  name: string;
  /** USD 센트 */
  priceCents: number;
  /** 지급할 30분 라운지 이용권 수 */
  passes: number;
  /** 한 줄 설명 */
  tagline: string;
  /** 카드에 나열할 혜택 */
  features: string[];
  /** 구매 시 부여되는 회원 등급 */
  membership: MembershipType;
  /** 우선 매칭 크레딧 */
  priorityMatchingCredits: number;
  /** 배지 문구 (없으면 표시 안 함) */
  badge: string | null;
  /** 시각적 강조 단계 — 결제 페이지 레이아웃이 참조합니다. */
  emphasis: "none" | "hero" | "luxury";
  /** Creem 상품 ID를 담는 환경 변수 이름 */
  productIdEnv: string;
}

/**
 * 표시 순서 = 배열 순서. 데스크톱에서는 이 순서대로 4열이고, GOLD가 세 번째
 * (핵심 위치)에 옵니다. 모바일에서는 결제 페이지가 GOLD를 맨 앞으로 올립니다.
 */
export const PASS_PLANS: readonly PassPlan[] = [
  {
    code: "one_time",
    name: "ONE TIME",
    priceCents: 499,
    passes: 1,
    tagline: "부담 없이 시작하세요",
    features: [
      "30분 라운지 이용권 1회",
      "언제든 다시 구매 가능",
      "AI 라운지 매니저 매칭",
    ],
    membership: "standard",
    priorityMatchingCredits: 0,
    badge: null,
    emphasis: "none",
    productIdEnv: "CREEM_ONE_TIME_PRODUCT_ID",
  },
  {
    code: "light",
    name: "LIGHT",
    priceCents: 2399,
    passes: 5,
    tagline: "가끔 이용하는 회원에게",
    features: [
      "30분 라운지 이용권 5회",
      "이용권 유효기간 없음",
      "AI 라운지 매니저 매칭",
    ],
    membership: "standard",
    priorityMatchingCredits: 0,
    badge: null,
    emphasis: "none",
    productIdEnv: "CREEM_LIGHT_PRODUCT_ID",
  },
  {
    code: "gold",
    name: "GOLD",
    priceCents: 2999,
    passes: 10,
    tagline: "단 $6 추가로 이용 횟수 2배",
    features: [
      "30분 라운지 이용권 10회",
      "LIGHT 대비 1회당 절반 이하",
      "이용권 유효기간 없음",
      "AI 라운지 매니저 매칭",
    ],
    membership: "standard",
    priorityMatchingCredits: 0,
    badge: "가장 인기",
    emphasis: "hero",
    productIdEnv: "CREEM_GOLD_PRODUCT_ID",
  },
  {
    code: "black_vip",
    name: "BLACK VIP",
    priceCents: 7999,
    passes: 20,
    tagline: "최상의 매칭 경험",
    features: [
      "30분 라운지 이용권 20회",
      "VIP 프로필 배지",
      "우선 매칭 10회",
      "조건 지정 매칭",
      "VIP 전용 라운지 입장",
    ],
    membership: "vip",
    priorityMatchingCredits: 10,
    badge: "VIP",
    emphasis: "luxury",
    productIdEnv: "CREEM_BLACK_VIP_PRODUCT_ID",
  },
] as const;

export function getPlan(code: string): PassPlan | null {
  return PASS_PLANS.find((p) => p.code === code) ?? null;
}

/* ------------------------------------------------------------ 추가 과금 */

export type AddonCode =
  | "extend_10"
  | "extend_30"
  | "rematch_now"
  | "filtered_match"
  | "gift_extend_30";

export interface Addon {
  code: AddonCode;
  name: string;
  priceCents: number;
  description: string;
  /** 세션 연장 상품이면 연장 분 수 */
  extendMinutes: number | null;
  productIdEnv: string;
}

export const ADDONS: readonly Addon[] = [
  {
    code: "extend_10",
    name: "10분 연장",
    priceCents: 199,
    description: "진행 중인 라운지를 10분 더 이어갑니다.",
    extendMinutes: 10,
    productIdEnv: "CREEM_EXTEND_10_PRODUCT_ID",
  },
  {
    code: "extend_30",
    name: "30분 연장",
    priceCents: 399,
    description: "진행 중인 라운지를 30분 더 이어갑니다.",
    extendMinutes: 30,
    productIdEnv: "CREEM_EXTEND_30_PRODUCT_ID",
  },
  {
    code: "rematch_now",
    name: "즉시 재매칭",
    priceCents: 99,
    description: "대기 없이 다음 상대 라운지를 바로 찾습니다.",
    extendMinutes: null,
    productIdEnv: "CREEM_REMATCH_NOW_PRODUCT_ID",
  },
  {
    code: "filtered_match",
    name: "조건 지정 매칭",
    priceCents: 199,
    description: "원하는 조건을 좁혀 상대 라운지를 찾습니다.",
    extendMinutes: null,
    productIdEnv: "CREEM_FILTERED_MATCH_PRODUCT_ID",
  },
  {
    code: "gift_extend_30",
    name: "상대에게 30분 연장 선물",
    priceCents: 399,
    description: "상대 라운지의 시간을 대신 연장해 줍니다.",
    extendMinutes: 30,
    productIdEnv: "CREEM_GIFT_EXTEND_30_PRODUCT_ID",
  },
] as const;

export function getAddon(code: string): Addon | null {
  return ADDONS.find((a) => a.code === code) ?? null;
}

/** 결제 대상 = 이용권 상품 또는 추가 과금 상품. */
export type PurchasableCode = PlanCode | AddonCode;

export function getPurchasable(code: string): PassPlan | Addon | null {
  return getPlan(code) ?? getAddon(code);
}

/* -------------------------------------------------------------- 표시용 */

/** 라운지 1회 이용 시간(분). 서버가 만료 시각을 계산하는 기준입니다. */
export const LOUNGE_MINUTES = 30;

export const CURRENCY = "USD";

/** 499 → "$4.99" */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * 1회당 단가. 실제 계산값만 보여주며, 존재하지 않는 정가나 할인율은 만들지
 * 않습니다(다크 패턴 금지).
 */
export function pricePerPass(plan: PassPlan): string {
  return `$${(plan.priceCents / plan.passes / 100).toFixed(2)}`;
}
