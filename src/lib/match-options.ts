import type { ConversationEnergy, DesiredGender } from "@/lib/db/types";
import type { Translate } from "@/lib/i18n/types";

/**
 * 선호 입력 선택지 — 폼과 서버 검증이 공유합니다.
 *
 * **값과 표기는 다른 것입니다.** 아래 배열에 든 값은 DB에 그대로 저장되고
 * 매칭이 공통점을 셀 때 쓰는 키라서, 한국어 문자열이어도 바꾸면 안 됩니다
 * (이미 저장된 회원 정보가 전부 어긋납니다). 화면에 보이는 글자는 사전에서
 * 따로 찾습니다 — 아래 `*Label` 함수들이 그 역할을 합니다.
 */

export const GENDER_OPTIONS: { value: DesiredGender }[] = [
  { value: "female" },
  { value: "male" },
  { value: "any" },
];

export const ENERGY_OPTIONS: { value: ConversationEnergy }[] = [
  { value: "relaxed" },
  { value: "balanced" },
  { value: "lively" },
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

/* ------------------------------------------------------------ 화면 표기 */

/**
 * 저장값 → 사전 키.
 *
 * 저장값이 한국어라 사전 키로 그대로 쓸 수 없습니다(다른 언어 사전 파일이
 * 한국어 키로 뒤덮입니다). 여기서 한 번 갈아 끼웁니다.
 */
const INTEREST_KEY: Record<string, string> = {
  여행: "travel",
  미식: "food",
  음악: "music",
  재즈: "jazz",
  영화: "movies",
  사진: "photography",
  전시: "exhibitions",
  카페: "cafes",
  책: "books",
  러닝: "running",
  운동: "fitness",
  게임: "games",
};

const AGE_BAND_KEY: Record<string, string> = {
  "20대 초반": "early20s",
  "20대 후반": "late20s",
  "30대 초반": "early30s",
  "30대 후반": "late30s",
};

/**
 * 사전에서 못 찾으면 저장값을 그대로 보여 줍니다.
 *
 * `t()`는 없는 키를 받으면 키 문자열을 돌려주므로, 그대로 두면 화면에
 * `options.interests.travel`이 뜹니다. 선택지가 늘었는데 사전을 채우지 않은
 * 경우에는 키보다 저장값(한국어)이 낫습니다 — 적어도 읽을 수는 있습니다.
 */
function labelOr(t: Translate, key: string, fallback: string): string {
  const found = t(key);
  return found === key ? fallback : found;
}

export function genderLabel(t: Translate, value: DesiredGender): string {
  return labelOr(t, `options.gender.${value}`, value);
}

export function energyLabel(t: Translate, value: ConversationEnergy): string {
  return labelOr(t, `options.energy.${value}`, value);
}

export function interestLabel(t: Translate, value: string): string {
  return labelOr(t, `options.interests.${INTEREST_KEY[value] ?? value}`, value);
}

export function ageBandLabel(t: Translate, value: string): string {
  return labelOr(t, `options.ageBands.${AGE_BAND_KEY[value] ?? value}`, value);
}
