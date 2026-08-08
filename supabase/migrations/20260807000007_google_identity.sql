-- ============================================================================
-- ClubOn — Google 계정 연결
--   · users.google_sub: Google 계정의 불변 식별자(id_token의 sub 클레임)
--
-- 이메일은 바뀔 수 있고, 해지된 주소는 다른 사람에게 다시 배정될 수도 있습니다.
-- 한 번 연결한 뒤로는 이메일이 아니라 sub로 계정을 찾아, 주소가 바뀌어도 같은
-- 계정으로 들어오고 주소가 남에게 넘어가도 계정이 넘어가지 않게 합니다.
-- ============================================================================

alter table public.users
  add column if not exists google_sub text;

-- 한 Google 계정이 여러 회원 계정에 연결되지 않도록 막습니다.
-- (null은 유니크 제약에서 서로 충돌하지 않으므로 미연결 계정은 제한 없음)
create unique index if not exists users_google_sub_key
  on public.users (google_sub)
  where google_sub is not null;
