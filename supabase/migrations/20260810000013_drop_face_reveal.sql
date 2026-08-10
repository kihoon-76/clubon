-- ============================================================================
-- ClubOn — 마스크·얼굴 공개 제거
--
-- 제품에서 마스크 대화와 방장 합의 얼굴 공개가 없어졌습니다. 이 자리는 사람과
-- 사람이 아니라 **공간과 공간**을 잇고, 라운지 하나는 기기 한 대로 참여하므로
-- 가릴 얼굴도, 합의로 벗길 마스크도 남지 않습니다.
--
-- 지우는 대상은 **앱이 한 번도 쓴 적 없는 구조**뿐입니다. 라이브 룸은 Phase 1
-- 인메모리 런타임으로 동작해 `participant_sessions`·`reveal_agreements`에는
-- 운영 데이터가 쌓이지 않았습니다(코드에 두 테이블을 읽고 쓰는 곳이 없습니다).
--
-- 반대로 `consent_type`의 `face_tracking`·`mutual_face_reveal`은 **남겨 둡니다.**
-- 회원이 실제로 동의한 기록이라, 값이 사라지면 과거 동의 이력을 읽을 수 없게
-- 됩니다. 앱이 지금 받는 항목은 `lib/consent/items.ts`가 정합니다.
-- ============================================================================

drop table if exists public.reveal_agreements;
drop type if exists public.reveal_agreement_state;

alter table public.participant_sessions
  drop column if exists mask;

drop type if exists public.mask_kind;
