import type { ConsentType } from "@/lib/db/types";
import type { Translate } from "@/lib/i18n/types";

/**
 * 동의 항목 정의. 필수/선택을 구분하며, 서버 액션이 이 목록으로 검증합니다.
 * 버전이 오르면 재동의를 받습니다.
 *
 * **문구는 여기 없습니다.** 회원이 실제로 읽고 동의하는 문장이라 읽는 사람의
 * 언어로 나가야 하고, 그래서 사전(`consent.<타입>.title|body`)에서 찾습니다.
 * 이 목록이 정하는 것은 항목의 존재와 필수 여부뿐입니다.
 */

export const CONSENT_VERSION = "2026-08-01";

export interface ConsentItem {
  type: ConsentType;
  required: boolean;
}

export const CONSENT_ITEMS: ConsentItem[] = [
  { type: "terms_of_service", required: true },
  { type: "privacy_policy", required: true },
  { type: "adult_only", required: true },
  { type: "camera_microphone", required: true },
  { type: "ai_text_moderation", required: true },
  { type: "anti_recording", required: true },
  { type: "community_standards", required: true },
  { type: "mutual_face_reveal", required: true },
  { type: "ai_video_moderation", required: false },
  { type: "face_tracking", required: false },
];

/** 동의 항목의 제목·본문 — 사전에서 찾습니다. */
export function consentTitle(t: Translate, type: ConsentType): string {
  return t(`consent.${type}.title`);
}

export function consentBody(t: Translate, type: ConsentType): string {
  return t(`consent.${type}.body`);
}

export const REQUIRED_CONSENT_TYPES: ConsentType[] = CONSENT_ITEMS.filter(
  (i) => i.required,
).map((i) => i.type);
