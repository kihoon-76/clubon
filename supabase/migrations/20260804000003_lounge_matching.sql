-- ============================================================================
-- ClubOn — 라운지 매칭/부킹 확장
--   · 프로필 성별
--   · 라운지(테이블)의 담당 라운지 매니저
--   · 매칭 선호의 원하는 성별
--   · 라운지↔라운지 부킹
-- ============================================================================

create type public.gender as enum ('female', 'male', 'other');
create type public.desired_gender as enum ('female', 'male', 'any');

alter table public.profiles
  add column gender public.gender not null default 'other';

alter table public.tables
  add column waiter_id text;

alter table public.table_preferences
  add column desired_gender public.desired_gender not null default 'any';

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  requester_table_id uuid not null references public.tables (id) on delete cascade,
  matched_table_id uuid not null references public.tables (id) on delete cascade,
  waiter_id text,
  score integer not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (requester_table_id <> matched_table_id)
);

create index bookings_requester_idx
  on public.bookings (requester_table_id, created_at desc);
