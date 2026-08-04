/**
 * 신고 사유 목록. 서버 액션과 신고 모달이 공유합니다.
 *
 * `"use server"` 파일은 async 함수만 export할 수 있으므로 상수는 여기에 둡니다.
 */
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
