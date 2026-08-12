/**
 * 상품 카탈로그 — 가격·제공량의 단일 출처.
 *
 * 화면(입장 신청·마이페이지·관리자)과 서버(체크아웃·웹훅 지급)가 모두 이 표만
 * 참조합니다. 컴포넌트 안에 값을 다시 적지 마세요.
 *
 * 금액은 **USD 센트 정수**로 둡니다. 부동소수 반올림으로 결제 금액이 틀어지는
 * 일을 원천적으로 막고, Creem이 돌려주는 금액과도 같은 단위로 비교합니다.
 *
 * 실제 판매 가격은 Creem 대시보드에 만든 상품이 결정합니다. 여기 값은 화면
 * 표시와 지급량 계산용이며, 웹훅 처리 시 Creem이 알려준 실제 결제 금액을
 * 함께 기록해 불일치를 관리자 화면에서 확인할 수 있게 합니다.
 *
 * ── 파는 것은 두 종류입니다 ──────────────────────────────────────────
 *
 *   **매치 횟수**   방 하나를 여는 권리. 입장료로 5회를 받고, 모자라면 1회씩
 *                   더 삽니다. 성별과 무관하게 같은 값을 냅니다.
 *   **시간 연장**   이미 열린 방의 30분을 뒤로 미는 것. 매치 횟수는 쓰지
 *                   않고 돈만 받습니다.
 */

import type { Translate } from "@/lib/i18n/types";

/* ------------------------------------------------------------ 매치 횟수 */

export type CreditCode = "entry_pass";

export interface CreditProduct {
  code: CreditCode;
  /** USD 센트 */
  priceCents: number;
  /** 지급할 방 매치 횟수 */
  matches: number;
  /**
   * 카드에 나열할 내용의 개수.
   *
   * 문구 자체는 사전(`products.<코드>.f1`…)에 있습니다. 여기 남는 것은 몇 줄을
   * 찾아야 하는지뿐입니다 — 상품마다 줄 수가 달라서 사전만으로는 알 수 없습니다.
   */
  featureCount: number;
  /** Creem 상품 ID를 담는 환경 변수 이름 */
  productIdEnv: string;
}

/**
 * 입장료 — 라운지에 처음 들어올 때 내는 값.
 *
 * 성별에 따라 값을 다르게 받지 않습니다. 한쪽만 돈을 내는 구조는 그 자리를
 * 만남이 아니라 거래로 만들고, 결국 서비스 전체의 성격을 바꿉니다.
 */
export const ENTRY_PASS: CreditProduct = {
  code: "entry_pass",
  priceCents: 3000,
  matches: 5,
  featureCount: 4,
  productIdEnv: "CREEM_ENTRY_PASS_PRODUCT_ID",
};

/** 추가 매치 — 받은 5회를 다 쓴 뒤 1회씩 더 사는 상품. */
export const CREDIT_PRODUCTS: readonly CreditProduct[] = [ENTRY_PASS] as const;

export function getCreditProduct(code: string): CreditProduct | null {
  return CREDIT_PRODUCTS.find((p) => p.code === code) ?? null;
}

/* ------------------------------------------------------------ 시간 연장 */

export type ExtensionCode = never;

/**
 * 영상방 안에서 이 상품을 살 수 있는 사람.
 *
 * 방 시간은 그 안의 모두가 함께 쓰는 자원입니다. 그래서 연장 상품은 **방을 연
 * 회원이 자기 방을 늘리는 것**과 **다른 참가자가 대신 늘려 주는 것(선물)**로
 * 나뉩니다. 어느 쪽이든 늘어나는 시간은 방 전체의 시간이며, 결제한 사람에게서만
 * 돈이 빠집니다.
 */
export type InRoomBuyer = "payer" | "guest";

export interface ExtensionAddon {
  code: ExtensionCode;
  priceCents: number;
  /** 늘려 줄 분 수 */
  extendMinutes: number;
  /** 영상방 안에서 이 상품을 살 수 있는 사람 */
  inRoomBuyer: InRoomBuyer;
  productIdEnv: string;
}

/**
 * 연장 단위는 방 기본 시간과 같은 30분 하나뿐입니다.
 *
 * 10분·30분처럼 단위를 여럿 두면 남은 시간이 5분일 때 무엇을 사야 하는지
 * 회원이 계산해야 합니다. 기본 시간과 같은 단위로 통일하면 "한 번 더"만
 * 누르면 됩니다.
 */
export const EXTENSION_ADDONS: readonly ExtensionAddon[] = [];

/** 연장 상품이면 반환합니다. 아니면 null — 체크아웃·웹훅의 판매 가능 판정입니다. */
export function getExtensionAddon(code: string): ExtensionAddon | null {
  return EXTENSION_ADDONS.find((a) => a.code === code) ?? null;
}

/** 이 사람이 방 안에서 살 수 있는 연장 상품 (방을 연 회원인지로 갈립니다). */
export function extensionsFor(buyer: InRoomBuyer): ExtensionAddon[] {
  return EXTENSION_ADDONS.filter((a) => a.inRoomBuyer === buyer);
}

/* ---------------------------------------------------------------- 공통 */

/** 결제 대상 = 매치 횟수 상품 또는 시간 연장 상품. */
export type PurchasableCode = CreditCode | ExtensionCode;

export interface Purchasable {
  code: PurchasableCode;
  priceCents: number;
  productIdEnv: string;
}

export const PURCHASABLES: readonly Purchasable[] = [
  ...CREDIT_PRODUCTS,
  ...EXTENSION_ADDONS,
];

export function getPurchasable(code: string): Purchasable | null {
  return PURCHASABLES.find((p) => p.code === code) ?? null;
}

/* -------------------------------------------------------------- 표시용 */

/**
 * 상품명·설명은 **이 파일에 없습니다.**
 *
 * 회원이 결제 전에 읽는 문장이라 읽는 사람의 언어로 나가야 하고, 그래서
 * 사전(`products.<코드>.*`)에서 찾습니다. 카탈로그가 정하는 것은 값과 제공량,
 * 그리고 어느 환경 변수에 Creem 상품 ID가 들어 있는지입니다.
 */
export function productName(t: Translate, code: PurchasableCode): string {
  return t(`products.${code}.name`);
}

export function productTagline(t: Translate, code: CreditCode): string {
  return t(`products.${code}.tagline`);
}

export function productFeatures(t: Translate, product: CreditProduct): string[] {
  return Array.from({ length: product.featureCount }, (_, i) =>
    t(`products.${product.code}.f${i + 1}`),
  );
}

export function addonDescription(t: Translate, code: ExtensionCode): string {
  return t(`products.${code}.description`);
}

/** 방 하나의 기본 시간(분). 서버가 만료 시각을 계산하는 기준입니다. */
export const LOUNGE_MINUTES = 30;

export const CURRENCY = "USD";

/** 3000 → "$30.00" */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * 매치 1회당 단가. 실제 계산값만 보여주며, 존재하지 않는 정가나 할인율은
 * 만들지 않습니다(다크 패턴 금지).
 */
export function pricePerMatch(product: CreditProduct): string {
  return `$${(product.priceCents / product.matches / 100).toFixed(2)}`;
}
