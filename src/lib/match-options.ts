import type { ConversationEnergy, DesiredGender } from "@/lib/db/types";

/** 선호 입력 체크박스 옵션 — 폼과 서버 검증이 공유합니다. */

export const GENDER_OPTIONS: { value: DesiredGender; label: string }[] = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "any", label: "상관없음" },
];

export const ENERGY_OPTIONS: { value: ConversationEnergy; label: string }[] = [
  { value: "relaxed", label: "차분한" },
  { value: "balanced", label: "균형 잡힌" },
  { value: "lively", label: "활발한" },
];

export const INTEREST_OPTIONS = [
  "여행",
  "미식",
  "음악",
  "재즈",
  "영화",
  "사진",
  "전시",
  "카페",
  "책",
  "러닝",
  "운동",
  "게임",
] as const;

export const AGE_BAND_OPTIONS = [
  "20대 초반",
  "20대 후반",
  "30대 초반",
  "30대 후반",
] as const;

export const ENERGY_LABEL: Record<ConversationEnergy, string> = {
  relaxed: "차분한",
  balanced: "균형 잡힌",
  lively: "활발한",
};
