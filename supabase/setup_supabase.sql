-- ============================================================================
-- ClubOn — 코어 스키마
-- 그룹 테이블 기반 온라인 화상 소셜 클럽
--
-- 설계 원칙
--   · 원본 영상, 원본 신분증 이미지는 저장하지 않습니다.
--   · 외모 평가/매력도 점수 컬럼은 존재하지 않습니다.
--   · 상태 전이는 애플리케이션 서버가 검증하며, 스키마는 불변식을 CHECK로 보강합니다.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ enums --

create type public.user_role as enum ('user', 'moderator', 'admin');
create type public.account_status as enum ('active', 'suspended', 'banned');

create type public.verification_method as enum ('email', 'phone', 'document');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'failed');

create type public.consent_type as enum (
  'terms_of_service',
  'privacy_policy',
  'adult_only',
  'camera_microphone',
  'ai_text_moderation',
  'ai_video_moderation',
  'face_tracking',
  'anti_recording',
  'community_standards',
  'mutual_face_reveal'
);

create type public.table_state as enum (
  'FORMING',
  'READY',
  'WAITING',
  'MATCH_PROPOSED',
  'MATCH_ACCEPTED',
  'LIVE',
  'PAUSED',
  'CLOSED',
  'MODERATION_LOCKED'
);

create type public.table_member_role as enum ('host', 'member');
create type public.conversation_energy as enum ('relaxed', 'balanced', 'lively');

create type public.proposal_state as enum (
  'PENDING',
  'A_ACCEPTED',
  'B_ACCEPTED',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED'
);
create type public.proposal_response as enum ('pending', 'accepted', 'declined');

create type public.session_state as enum ('live', 'paused', 'ended', 'locked');
create type public.mask_kind as enum ('fox', 'cat', 'rabbit', 'bear', 'wolf');
create type public.video_state as enum ('ok', 'blurred', 'frozen', 'avatar');

-- 얼굴 공개는 세션당 1건의 합의로 관리합니다(두 라운지 방장의 합의).
create type public.reveal_agreement_state as enum (
  'MASKED',
  'REVEAL_REQUESTED',
  'REVEALED',
  'REMASKED',
  'REVEAL_CANCELLED'
);

create type public.chat_scope as enum ('table', 'room');
create type public.chat_kind as enum ('user', 'system', 'waiter');
create type public.message_moderation_status as enum ('allowed', 'flagged', 'blocked');

create type public.moderation_context as enum ('chat', 'video', 'behavior');
create type public.moderation_severity as enum ('low', 'medium', 'high', 'critical');
create type public.moderation_source as enum ('rule', 'ai', 'report', 'admin');

create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.waiter_tier as enum ('standard', 'priority');

-- ------------------------------------------------------- accounts / people --

-- auth.users 를 확장하는 애플리케이션 사용자 레코드
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'user',
  status public.account_status not null default 'active',
  -- 만 19세 이상 여부만 저장하고 생년월일 원본은 보관하지 않습니다.
  adult_confirmed_at timestamptz,
  birth_year smallint check (birth_year between 1900 and 2100),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  age_band text not null,
  region text,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  conversation_style text,
  group_vibe public.conversation_energy not null default 'balanced',
  music text[] not null default '{}',
  travel text[] not null default '{}',
  hobbies text[] not null default '{}',
  availability text[] not null default '{}',
  -- 커뮤니티 평판. 외모와 무관한 안전/매너 지표입니다.
  reputation_score smallint not null default 70 check (reputation_score between 0 and 100),
  completed_sessions integer not null default 0 check (completed_sessions >= 0),
  report_count integer not null default 0 check (report_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_nickname_key on public.profiles (lower(nickname));

create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  method public.verification_method not null,
  status public.verification_status not null default 'unverified',
  -- 외부 확인 기관의 참조 토큰만 저장합니다. 원본 문서는 저장하지 않습니다.
  provider_ref text,
  requested_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index identity_verifications_user_idx on public.identity_verifications (user_id);

create table public.account_suspensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  reason text not null,
  severity public.moderation_severity not null default 'medium',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  issued_by uuid references public.users (id) on delete set null,
  lifted_at timestamptz,
  lifted_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index account_suspensions_user_idx on public.account_suspensions (user_id, lifted_at);

-- ------------------------------------------------------------------ consent --

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  consent_type public.consent_type not null,
  version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip_hash text,
  device_id text
);

create index consents_user_type_idx on public.consents (user_id, consent_type, granted_at desc);

-- --------------------------------------------------------- club / schedule --

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Seoul',
  min_table_size smallint not null default 2 check (min_table_size >= 2),
  max_table_size smallint not null default 4 check (max_table_size >= min_table_size),
  -- 1:1 매칭 금지: 합석 룸 최소 인원은 4명 이상이어야 합니다.
  min_room_participants smallint not null default 4 check (min_room_participants >= 4),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.operating_hours (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  -- 0 = 일요일 … 6 = 토요일
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  -- 자정을 넘겨 닫는 경우 (예: 18:00 → 04:00)
  closes_next_day boolean not null default false,
  unique (club_id, day_of_week)
);

-- ------------------------------------------------------------------ tables --

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  host_user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  state public.table_state not null default 'FORMING',
  max_size smallint not null default 4 check (max_size between 2 and 4),
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  waiting_since timestamptz,
  closed_at timestamptz
);

create index tables_state_idx on public.tables (state, waiting_since);
create index tables_host_idx on public.tables (host_user_id);

create table public.table_members (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.table_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

-- 한 사용자는 동시에 하나의 활성 테이블에만 속할 수 있습니다.
create unique index table_members_active_user_idx
  on public.table_members (user_id)
  where left_at is null;

create unique index table_members_unique_active
  on public.table_members (table_id, user_id)
  where left_at is null;

create index table_members_table_idx on public.table_members (table_id);

create table public.table_preferences (
  table_id uuid primary key references public.tables (id) on delete cascade,
  age_bands text[] not null default '{}',
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  energy public.conversation_energy not null default 'balanced',
  topic_focus text[] not null default '{}',
  region_preference text,
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables (id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.users (id) on delete cascade,
  expires_at timestamptz not null,
  max_uses smallint not null default 3 check (max_uses > 0),
  used_count smallint not null default 0 check (used_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_table_idx on public.invitations (table_id);

-- ---------------------------------------------------------------- matching --

create table public.match_proposals (
  id uuid primary key default gen_random_uuid(),
  table_a_id uuid not null references public.tables (id) on delete cascade,
  table_b_id uuid not null references public.tables (id) on delete cascade,
  score numeric(5, 4) not null check (score between 0 and 1),
  reasons jsonb not null default '[]'::jsonb,
  state public.proposal_state not null default 'PENDING',
  a_response public.proposal_response not null default 'pending',
  b_response public.proposal_response not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (table_a_id <> table_b_id)
);

create index match_proposals_tables_idx on public.match_proposals (table_a_id, table_b_id, state);
create index match_proposals_state_idx on public.match_proposals (state, expires_at);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.match_proposals (id) on delete cascade,
  table_a_id uuid not null references public.tables (id) on delete cascade,
  table_b_id uuid not null references public.tables (id) on delete cascade,
  matched_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- sessions --

create table public.video_sessions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  state public.session_state not null default 'live',
  -- 합석한 두 라운지의 방장. 얼굴 공개를 결정할 수 있는 유일한 두 사람입니다.
  host_a_user_id uuid references public.users (id) on delete set null,
  host_b_user_id uuid references public.users (id) on delete set null,
  provider text not null default 'mock',
  room_ref text not null,
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  ended_at timestamptz,
  end_reason text
);

create index video_sessions_state_idx on public.video_sessions (state);

create table public.participant_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_sessions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  table_id uuid not null references public.tables (id) on delete cascade,
  mask public.mask_kind not null default 'fox',
  mic_on boolean not null default true,
  cam_on boolean not null default true,
  video_state public.video_state not null default 'ok',
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

create unique index participant_sessions_active_idx
  on public.participant_sessions (session_id, user_id)
  where left_at is null;

create index participant_sessions_session_idx on public.participant_sessions (session_id);

-- ----------------------------------------------------------- 얼굴 공개 합의 --

-- 공개는 참가자 개인이 아니라 합석한 두 라운지의 방장이 결정하며, 확정되면
-- 방 안의 모든 참가자에게 한꺼번에 적용됩니다. 세션당 합의는 정확히 1건입니다.
create table public.reveal_agreements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique
    references public.video_sessions (id) on delete cascade,
  state public.reveal_agreement_state not null default 'MASKED',
  -- 공개를 제안한 방장과 그 방장의 라운지. 반대쪽 라운지의 방장만 응답할 수 있습니다.
  requester_id uuid references public.users (id) on delete set null,
  requester_table_id uuid references public.tables (id) on delete set null,
  granted_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  -- 제안·공개 상태에는 반드시 제안한 방장과 라운지가 기록되어 있어야 합니다.
  constraint reveal_requires_requester
    check (
      state in ('MASKED', 'REMASKED')
      or (requester_id is not null and requester_table_id is not null)
    ),
  -- 공개는 서버가 양쪽 방장의 수락을 확정한 시각이 남아 있을 때만 성립합니다.
  constraint reveal_requires_grant
    check (state <> 'REVEALED' or granted_at is not null)
);

-- ------------------------------------------------------------------- chat --

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  scope public.chat_scope not null,
  scope_id uuid not null,
  sender_id uuid references public.users (id) on delete set null,
  kind public.chat_kind not null default 'user',
  body text not null check (char_length(body) <= 1000),
  moderation_status public.message_moderation_status not null default 'allowed',
  moderation_reason text,
  created_at timestamptz not null default now()
);

create index chat_messages_scope_idx on public.chat_messages (scope, scope_id, created_at);

-- ------------------------------------------------------------- moderation --

create table public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid references public.users (id) on delete set null,
  context public.moderation_context not null,
  context_ref uuid,
  category text not null,
  severity public.moderation_severity not null,
  action_taken text not null,
  source public.moderation_source not null,
  detail jsonb not null default '{}'::jsonb,
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index moderation_events_subject_idx on public.moderation_events (subject_user_id, created_at desc);
create index moderation_events_review_idx on public.moderation_events (reviewed_at, severity);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  reported_user_id uuid not null references public.users (id) on delete cascade,
  session_id uuid references public.video_sessions (id) on delete set null,
  category text not null,
  description text check (char_length(description) <= 2000),
  status public.report_status not null default 'open',
  resolved_by uuid references public.users (id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (reporter_id <> reported_user_id)
);

create index reports_status_idx on public.reports (status, created_at desc);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users (id) on delete cascade,
  blocked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

-- ----------------------------------------------------------------- waiter --

-- MVP 에서는 실제 결제를 처리하지 않는 모의 크레딧입니다.
create table public.waiter_tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  table_id uuid not null references public.tables (id) on delete cascade,
  credits smallint not null check (credits > 0),
  tier public.waiter_tier not null default 'priority',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index waiter_tips_table_idx on public.waiter_tips (table_id, expires_at desc);

create table public.waiter_activity (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables (id) on delete cascade,
  action text not null,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index waiter_activity_table_idx on public.waiter_activity (table_id, created_at desc);

-- --------------------------------------------------------------- feedback --

create table public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_sessions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  vibe text,
  would_rematch boolean,
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

-- ------------------------------------------------------- updated_at 트리거 --

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch before update on public.users
  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger tables_touch before update on public.tables
  for each row execute function public.touch_updated_at();
create trigger table_preferences_touch before update on public.table_preferences
  for each row execute function public.touch_updated_at();
create trigger reveal_agreements_touch before update on public.reveal_agreements
  for each row execute function public.touch_updated_at();

-- --------------------------------------------- auth.users → public.users 동기화 --

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- ClubOn — 라운지 매칭/부킹 확장
--   · 프로필 성별
--   · 라운지(테이블)의 담당 웨이터
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


-- ============================================================================
-- 데모 시드 (auth 불필요 버전) — 배포 미리보기용
--   public.users FK(auth.users)를 제거하고 데모 유저/프로필/후보 라운지를 직접 삽입
-- ============================================================================
alter table public.users drop constraint if exists users_id_fkey;

insert into public.users (id,email,role,status,adult_confirmed_at,onboarding_completed_at) values
 ('aaaaaaaa-0000-0000-0000-000000000001','admin@clubon.test','admin','active',now(),now()),
 ('aaaaaaaa-0000-0000-0000-000000000002','mod@clubon.test','moderator','active',now(),now()),
 ('aaaaaaaa-0000-0000-0000-000000000003','hana@clubon.test','user','active',now(),now()),
 ('aaaaaaaa-0000-0000-0000-000000000004','doyun@clubon.test','user','active',now(),now()),
 ('aaaaaaaa-0000-0000-0000-000000000005','seoyeon@clubon.test','user','active',now(),now()),
 ('aaaaaaaa-0000-0000-0000-000000000006','jiho@clubon.test','user','active',now(),now()),
 ('aaaaaaaa-0000-0000-0000-000000000007','minseo@clubon.test','user','active',now(),now()),
 ('aaaaaaaa-0000-0000-0000-000000000008','taeyang@clubon.test','user','active',now(),now())
on conflict (id) do nothing;

insert into public.profiles (user_id,nickname,gender,age_band,region,languages,interests,group_vibe) values
 ('aaaaaaaa-0000-0000-0000-000000000001','관리자','male','30대 초반','서울',array['한국어','English'],array['와인','여행','재즈'],'relaxed'),
 ('aaaaaaaa-0000-0000-0000-000000000002','모더레이터','male','30대 초반','서울',array['한국어','English'],array['영화','게임','음악'],'lively'),
 ('aaaaaaaa-0000-0000-0000-000000000003','하나','female','20대 후반','서울',array['한국어','English'],array['여행','음악','영화'],'balanced'),
 ('aaaaaaaa-0000-0000-0000-000000000004','도윤','male','30대 초반','서울',array['한국어','English'],array['음악','재즈','책'],'relaxed'),
 ('aaaaaaaa-0000-0000-0000-000000000005','서연','female','20대 후반','서울',array['한국어','English'],array['여행','미식','사진'],'balanced'),
 ('aaaaaaaa-0000-0000-0000-000000000006','지호','male','30대 초반','서울',array['한국어','English'],array['음악','영화','러닝'],'relaxed'),
 ('aaaaaaaa-0000-0000-0000-000000000007','민서','female','20대 후반','서울',array['한국어','English'],array['여행','전시','카페'],'balanced'),
 ('aaaaaaaa-0000-0000-0000-000000000008','태양','male','30대 초반','서울',array['한국어','English'],array['운동','게임','영화'],'lively')
on conflict (user_id) do nothing;

insert into public.clubs (id,name,timezone,min_table_size,max_table_size,min_room_participants)
values ('11111111-1111-1111-1111-111111111111','ClubOn Seoul','Asia/Seoul',2,4,4)
on conflict (id) do nothing;

insert into public.operating_hours (club_id,day_of_week,opens_at,closes_at,closes_next_day)
select '11111111-1111-1111-1111-111111111111', d, time '18:00', time '04:00', true
from generate_series(0,6) as d
on conflict (club_id,day_of_week) do nothing;

insert into public.tables (id,club_id,host_user_id,name,state,max_size,invite_code,waiting_since) values
 ('cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004','재즈 & 북','WAITING',4,'JAZZ42',now()),
 ('cccccccc-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000005','주말 여행자','WAITING',4,'TRIP88',now()),
 ('cccccccc-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000008','심야 플레이','WAITING',4,'PLAY07',now())
on conflict (id) do nothing;

insert into public.table_members (table_id,user_id,role) values
 ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000004','host'),
 ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000006','member'),
 ('cccccccc-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000005','host'),
 ('cccccccc-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000007','member'),
 ('cccccccc-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000008','host'),
 ('cccccccc-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000002','member')
on conflict do nothing;

insert into public.table_preferences (table_id,energy,desired_gender) values
 ('cccccccc-0000-0000-0000-000000000001','relaxed','any'),
 ('cccccccc-0000-0000-0000-000000000002','balanced','any'),
 ('cccccccc-0000-0000-0000-000000000003','lively','any')
on conflict (table_id) do nothing;
