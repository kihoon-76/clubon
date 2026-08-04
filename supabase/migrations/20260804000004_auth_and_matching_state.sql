-- ============================================================================
-- ClubOn — 자체 인증 · 온보딩 · 매치 제안 상태
--   · public.users를 auth.users 없이도 생성 가능하게 (자체 이메일/비밀번호 인증)
--   · 동의 완료 시각
--   · 부킹(매치 제안)의 양측 수락 상태 · 만료 · 세션 연결
-- ============================================================================

-- --------------------------------------------------------------- users --

-- 자체 인증을 쓰는 배포에서는 auth.users 행 없이 가입할 수 있어야 합니다.
-- Supabase Auth를 붙일 경우 이 제약을 다시 추가하면 됩니다.
alter table public.users
  drop constraint if exists users_id_fkey;

alter table public.users
  alter column id set default gen_random_uuid();

alter table public.users
  add column if not exists password_hash text,
  add column if not exists consent_completed_at timestamptz;

create unique index if not exists users_email_lower_idx
  on public.users (lower(email));

-- ------------------------------------------------------------ consents --

-- 사용자·항목당 최신 동의 1건만 유지합니다(재동의 시 갱신).
delete from public.consents a
  using public.consents b
  where a.user_id = b.user_id
    and a.consent_type = b.consent_type
    and a.granted_at < b.granted_at;

create unique index if not exists consents_user_type_uniq
  on public.consents (user_id, consent_type);

alter table public.consents
  alter column granted_at drop not null;

-- ------------------------------------------------------------ bookings --

do $$ begin
  create type public.booking_state as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_response as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null;
end $$;

alter table public.bookings
  add column if not exists state public.booking_state not null default 'PENDING',
  add column if not exists requester_response public.booking_response not null default 'pending',
  add column if not exists matched_response public.booking_response not null default 'pending',
  add column if not exists expires_at timestamptz not null default now() + interval '5 minutes',
  add column if not exists session_id text;

create index if not exists bookings_matched_idx
  on public.bookings (matched_table_id, created_at desc);
create index if not exists bookings_state_idx
  on public.bookings (state, expires_at);
