-- ============================================================================
-- ClubOn — 이용권 차감 단위를 "참가자별"에서 "영상방 하나당"으로 변경
--
-- 영상방은 세션당 1개이고, 그 방에 모인 사람들이 다 함께 이야기합니다.
-- 따라서 이용권도 사람 수만큼이 아니라 **방 하나당 1회**만 차감합니다.
--
--   · 기본키: (session_id, user_id) → session_id
--   · user_id의 의미: "이 방에 들어온 사람" → "이 방의 이용권을 부담한 회원"
--     (= 매칭을 요청해 방을 연 라운지의 방장)
-- ============================================================================

-- 기존 데이터가 있다면 세션당 가장 먼저 만들어진 행만 남깁니다.
-- started_at이 같을 수 있으므로 ctid로 순서를 확정해 정확히 1행만 남깁니다.
delete from public.lounge_usages a
  using public.lounge_usages b
  where a.session_id = b.session_id
    and (a.started_at, a.ctid) > (b.started_at, b.ctid);

alter table public.lounge_usages
  drop constraint if exists lounge_usages_pkey;

alter table public.lounge_usages
  add primary key (session_id);

comment on column public.lounge_usages.user_id is
  '이용권을 부담한 회원 — 매칭을 요청해 이 방을 연 라운지의 방장';
comment on column public.lounge_usages.deducted_passes is
  '방 하나당 차감된 이용권 수(1). 참가자 수와 무관합니다.';
