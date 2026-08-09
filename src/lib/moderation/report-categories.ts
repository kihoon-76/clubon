/**
 * 신고 사유 목록. 서버 액션과 신고 모달이 공유합니다.
 *
 * `"use server"` 파일은 async 함수만 export할 수 있으므로 상수는 여기에 둡니다.
 */
import type { Translate } from "@/lib/i18n/types";

export const REPORT_CATEGORIES = [
  "괴롭힘 · 모욕",
  "혐오 표현",
  "성적 괴롭힘",
  "협박",
  "촬영 · 녹화 정황",
  "미성년자로 의심됨",
  "스팸 · 외부 유도",
  "기타",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

/**
 * 저장값 → 사전 키.
 *
 * 위 배열의 값은 신고 기록에 그대로 저장되므로 바꾸지 않습니다. 화면에 보이는
 * 글자만 사전에서 찾습니다.
 */
const CATEGORY_KEY: Record<string, string> = {
  "괴롭힘 · 모욕": "harassment",
  "혐오 표현": "hate",
  "성적 괴롭힘": "sexual",
  협박: "threat",
  "촬영 · 녹화 정황": "recording",
  "미성년자로 의심됨": "minor",
  "스팸 · 외부 유도": "spam",
  기타: "other",
};

export function reportCategoryLabel(t: Translate, value: string): string {
  const key = `reportCategories.${CATEGORY_KEY[value] ?? value}`;
  const found = t(key);
  return found === key ? value : found;
}
