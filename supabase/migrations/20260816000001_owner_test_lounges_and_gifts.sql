alter table public.tables
  add column if not exists is_test boolean not null default false,
  add column if not exists test_image_url text;

create index if not exists tables_real_matching_idx
  on public.tables (state, waiting_since)
  where is_test = false and closed_at is null;

create table if not exists public.pass_gift_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  sender_user_id uuid not null references public.users (id) on delete cascade,
  recipient_user_id uuid not null references public.users (id) on delete cascade,
  matches smallint not null default 1 check (matches = 1),
  status text not null default 'issued' check (status in ('issued', 'redeemed', 'revoked')),
  expires_at timestamptz not null default now() + interval '30 days',
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.pass_gift_codes enable row level security;
revoke all on table public.pass_gift_codes from public, anon, authenticated;

create index if not exists pass_gift_recipient_idx
  on public.pass_gift_codes (recipient_user_id, status, created_at desc);

create or replace function public.count_today_users(p_secret text)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today_count integer;
begin
  perform set_config('clubon.presence_secret', p_secret, true);
  select count(*)::integer into today_count
  from public.user_presence
  where last_seen_at >= (
    date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
  );
  return today_count;
end;
$$;

revoke all on function public.count_today_users(text) from public, authenticated;
grant execute on function public.count_today_users(text) to anon;

-- These accounts and lounges are synthetic test fixtures. Real matching excludes is_test rows.
insert into public.users (id, email, role, status, adult_confirmed_at, birth_year, birth_date, onboarding_completed_at, consent_completed_at)
values
  ('b1000000-0000-4000-8000-000000000020', 'virtual-20s@clubon.test', 'user', 'active', now(), 1999, '1999-04-12', now(), now()),
  ('b1000000-0000-4000-8000-000000000030', 'virtual-30s@clubon.test', 'user', 'active', now(), 1991, '1991-08-21', now(), now()),
  ('b1000000-0000-4000-8000-000000000040', 'virtual-40s@clubon.test', 'user', 'active', now(), 1981, '1981-02-17', now(), now()),
  ('b1000000-0000-4000-8000-000000000050', 'virtual-50s@clubon.test', 'user', 'active', now(), 1971, '1971-11-09', now(), now())
on conflict (id) do update set email = excluded.email;

insert into public.profiles (user_id, nickname, gender, age_band, region, languages, interests, conversation_style, group_vibe)
values
  ('b1000000-0000-4000-8000-000000000020', '루나 테스트', 'female', '20대', '서울', array['한국어','English'], array['여행','음악','카페'], '빠르고 유쾌한 티키타카', 'lively'),
  ('b1000000-0000-4000-8000-000000000030', '소피 테스트', 'female', '30대', '서울', array['한국어','English'], array['미식','영화','전시'], '센스 있는 균형 대화', 'balanced'),
  ('b1000000-0000-4000-8000-000000000040', '클레어 테스트', 'female', '40대', '서울', array['한국어','English'], array['여행','재즈','사진'], '여유 있고 깊이 있는 대화', 'relaxed'),
  ('b1000000-0000-4000-8000-000000000050', '비비안 테스트', 'female', '50대', '서울', array['한국어','English'], array['미식','책','전시'], '위트 있는 품격 대화', 'balanced')
on conflict (user_id) do update set
  nickname = excluded.nickname, gender = excluded.gender, age_band = excluded.age_band,
  region = excluded.region, languages = excluded.languages, interests = excluded.interests,
  conversation_style = excluded.conversation_style, group_vibe = excluded.group_vibe;

insert into public.tables (id, club_id, host_user_id, name, state, max_size, invite_code, waiter_id, region_code, is_test, test_image_url, waiting_since)
select v.id, c.id, v.user_id, v.name, 'WAITING'::public.table_state, 4, v.invite_code, v.waiter_id, 'KR-11', true, v.image_url, now()
from public.clubs c
cross join (values
  ('b2000000-0000-4000-8000-000000000020'::uuid, 'b1000000-0000-4000-8000-000000000020'::uuid, '20대 캐주얼 스파크', 'VT20CLUB', 'dohyun', '/virtual-lounges/lounge-20s.png'),
  ('b2000000-0000-4000-8000-000000000030'::uuid, 'b1000000-0000-4000-8000-000000000030'::uuid, '30대 시티 밸런스', 'VT30CLUB', 'ian', '/virtual-lounges/lounge-30s.png'),
  ('b2000000-0000-4000-8000-000000000040'::uuid, 'b1000000-0000-4000-8000-000000000040'::uuid, '40대 재즈 앤 토크', 'VT40CLUB', 'jaeha', '/virtual-lounges/lounge-40s.png'),
  ('b2000000-0000-4000-8000-000000000050'::uuid, 'b1000000-0000-4000-8000-000000000050'::uuid, '50대 클래식 위트', 'VT50CLUB', 'taeo', '/virtual-lounges/lounge-50s.png')
) as v(id, user_id, name, invite_code, waiter_id, image_url)
where c.is_active
order by c.created_at
limit 4
on conflict (id) do update set
  name = excluded.name, waiter_id = excluded.waiter_id, region_code = excluded.region_code,
  is_test = true, test_image_url = excluded.test_image_url, closed_at = null;

insert into public.table_members (table_id, user_id, role)
values
  ('b2000000-0000-4000-8000-000000000020', 'b1000000-0000-4000-8000-000000000020', 'host'),
  ('b2000000-0000-4000-8000-000000000030', 'b1000000-0000-4000-8000-000000000030', 'host'),
  ('b2000000-0000-4000-8000-000000000040', 'b1000000-0000-4000-8000-000000000040', 'host'),
  ('b2000000-0000-4000-8000-000000000050', 'b1000000-0000-4000-8000-000000000050', 'host')
on conflict do nothing;

insert into public.table_preferences (table_id, desired_gender, age_bands, languages, interests, energy, region_preference)
values
  ('b2000000-0000-4000-8000-000000000020', 'any', array['20대'], array['한국어','English'], array['여행','음악','카페'], 'lively', 'KR-11'),
  ('b2000000-0000-4000-8000-000000000030', 'any', array['30대'], array['한국어','English'], array['미식','영화','전시'], 'balanced', 'KR-11'),
  ('b2000000-0000-4000-8000-000000000040', 'any', array['40대'], array['한국어','English'], array['여행','재즈','사진'], 'relaxed', 'KR-11'),
  ('b2000000-0000-4000-8000-000000000050', 'any', array['50대'], array['한국어','English'], array['미식','책','전시'], 'balanced', 'KR-11')
on conflict (table_id) do update set
  desired_gender = excluded.desired_gender, age_bands = excluded.age_bands,
  languages = excluded.languages, interests = excluded.interests,
  energy = excluded.energy, region_preference = excluded.region_preference;
