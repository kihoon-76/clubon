import type { ConsentType } from "@/lib/db/types";

/**
 * 동의 항목 정의. 필수/선택을 구분하며, 서버 액션이 이 목록으로 검증합니다.
 * 버전이 오르면 재동의를 받습니다.
 */

export const CONSENT_VERSION = "2026-08-01";

export interface ConsentItem {
  type: ConsentType;
  title: string;
  body: string;
  required: boolean;
}

export const CONSENT_ITEMS: ConsentItem[] = [
  {
    type: "terms_of_service",
    title: "이용약관",
    body: "ClubOn 이용약관에 동의합니다.",
    required: true,
  },
  {
    type: "privacy_policy",
    title: "개인정보 처리방침",
    body: "개인정보의 수집·이용 목적과 보유 기간에 동의합니다.",
    required: true,
  },
  {
    type: "adult_only",
    title: "성인 전용 서비스",
    body: "만 19세 이상이며, 성인 전용 서비스임을 이해했습니다.",
    required: true,
  },
  {
    type: "camera_microphone",
    title: "카메라·마이크 사용",
    body: "화상 대화를 위해 카메라와 마이크를 사용하는 것에 동의합니다.",
    required: true,
  },
  {
    type: "ai_text_moderation",
    title: "AI 텍스트 모더레이션",
    body: "채팅 메시지가 자동 검사 대상이 됨에 동의합니다. 자동 탐지는 모든 위반을 완벽하게 잡아내지 못할 수 있습니다.",
    required: true,
  },
  {
    type: "anti_recording",
    title: "촬영·녹화 금지",
    body: "다른 참가자의 영상·음성·개인정보를 캡처, 녹화, 촬영하거나 공유하지 않겠습니다. 위반 시 영구 이용정지 및 법적 책임이 따를 수 있습니다.",
    required: true,
  },
  {
    type: "community_standards",
    title: "커뮤니티 기준",
    body: "괴롭힘·혐오 표현·성적 괴롭힘을 하지 않으며, 상호 존중하는 대화에 참여합니다.",
    required: true,
  },
  {
    type: "mutual_face_reveal",
    title: "상호 얼굴 공개 방식",
    body: "얼굴 공개는 양측이 모두 동의한 경우에만, 해당 상대에게만 적용됨을 이해했습니다.",
    required: true,
  },
  {
    type: "ai_video_moderation",
    title: "AI 영상 안전 검사 (선택)",
    body: "영상 프레임의 안전 검사에 동의합니다. 영상 원본은 저장되지 않으며 판정 메타데이터만 기록됩니다.",
    required: false,
  },
  {
    type: "face_tracking",
    title: "얼굴 추적 기반 마스크 (선택)",
    body: "마스크 정합을 위한 얼굴 위치 추적에 동의합니다. 추적 실패 시 얼굴을 노출하지 않고 블러 처리합니다.",
    required: false,
  },
];

export const REQUIRED_CONSENT_TYPES: ConsentType[] = CONSENT_ITEMS.filter(
  (i) => i.required,
).map((i) => i.type);
