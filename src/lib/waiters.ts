/**
 * AI 라운지 매니저 로스터.
 *
 * 콘셉트: 유럽 귀족가를 관리하는 고급 라운지 매니저의 품격에, 한국적 감성과 다양한
 * 개성을 더한 10인. 회원은 라운지에서 원하는 라운지 매니저를 골라 대화를 맡깁니다.
 *
 * 얼굴 이미지는 추후 `photoUrl`에 실사 이미지를 넣으면 아바타가 자동으로
 * 교체됩니다(현재는 복장 스타일 기반 일러스트 아바타로 표시).
 *
 * ⚠️ 모두 데모용 AI 페르소나이며 실제 사람이 아닙니다.
 */

import type { Translate } from "@/lib/i18n/types";

export type WaiterStyle =
  | "tuxedo"
  | "suit"
  | "casual"
  | "hiphop"
  | "smoking"
  | "resort"
  | "allblack"
  | "tweed"
  | "leather"
  | "hospitality";

/**
 * 매니저의 **생김새와 정체성**만 여기 있습니다.
 *
 * 이름·별칭·소개처럼 읽는 문장은 전부 사전(`waiters.<id>.*`)에 있습니다.
 * 매니저는 회원이 고르기 전에 읽고 판단하는 대상이라, 한국어로만 적어 두면
 * 다른 언어 회원에게는 열 명이 전부 구별되지 않는 카드가 됩니다.
 */
export interface Waiter {
  id: string;
  /** 라운지 매니저 성별 (아바타 렌더·표시에 사용) */
  gender: "female" | "male";
  /** 복장 스타일 키 (아바타 렌더에 사용) */
  style: WaiterStyle;
  /** 아바타 강조색 (럭셔리 톤, 채도 낮춤) */
  accent: string;
  /** 실사 얼굴 이미지 (있으면 아바타 대신 사용) */
  photoUrl: string | null;
}

export const WAITERS: Waiter[] = [
  { id: "dohyun", gender: "male", style: "tuxedo", accent: "#d8be86", photoUrl: "/waiters/dohyun.webp" },
  { id: "ian", gender: "female", style: "suit", accent: "#b9bcc2", photoUrl: "/waiters/ian.webp" },
  { id: "jaeha", gender: "male", style: "casual", accent: "#c2a878", photoUrl: "/waiters/jaeha.webp" },
  { id: "taeo", gender: "male", style: "hiphop", accent: "#8a8f98", photoUrl: "/waiters/taeo.webp" },
  { id: "sunwoo", gender: "female", style: "smoking", accent: "#9e6b62", photoUrl: "/waiters/sunwoo.webp" },
  { id: "seojun", gender: "male", style: "resort", accent: "#6f8f6a", photoUrl: "/waiters/seojun.webp" },
  { id: "yujin", gender: "male", style: "allblack", accent: "#5b6a86", photoUrl: "/waiters/yujin.webp" },
  { id: "haram", gender: "female", style: "tweed", accent: "#b08d57", photoUrl: "/waiters/haram.webp" },
  { id: "jin", gender: "male", style: "leather", accent: "#7d6a86", photoUrl: "/waiters/jin.webp" },
  { id: "noah", gender: "male", style: "hospitality", accent: "#5f8a86", photoUrl: "/waiters/noah.webp" },
];

export function getWaiter(id: string): Waiter | undefined {
  return WAITERS.find((w) => w.id === id);
}

/* ------------------------------------------------------------ 화면 표기 */

/** 소개 카드에 나열하는 장점의 개수 — 열 명 모두 같습니다. */
const STRENGTH_COUNT = 3;

export function waiterName(t: Translate, waiter: Waiter): string {
  return t(`waiters.${waiter.id}.name`);
}

export function waiterEpithet(t: Translate, waiter: Waiter): string {
  return t(`waiters.${waiter.id}.epithet`);
}

export function waiterOutfit(t: Translate, waiter: Waiter): string {
  return t(`waiters.${waiter.id}.outfit`);
}

export function waiterTagline(t: Translate, waiter: Waiter): string {
  return t(`waiters.${waiter.id}.tagline`);
}

export function waiterPersonality(t: Translate, waiter: Waiter): string {
  return t(`waiters.${waiter.id}.personality`);
}

export function waiterStrengths(t: Translate, waiter: Waiter): string[] {
  return Array.from({ length: STRENGTH_COUNT }, (_, i) =>
    t(`waiters.${waiter.id}.s${i + 1}`),
  );
}

export function waiterSpecialty(t: Translate, waiter: Waiter): string {
  return t(`waiters.${waiter.id}.specialty`);
}
