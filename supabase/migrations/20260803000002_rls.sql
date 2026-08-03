-- ============================================================================
-- ClubOn — Row Level Security
--
-- 기본 방침: 모든 테이블에 RLS 를 켜고, 명시된 정책 외에는 접근을 거부합니다.
-- 쓰기 작업 대부분은 서버 액션이 service-role 로 수행하며(service-role 은 RLS 우회),
-- 여기서는 브라우저에서 anon/authenticated 키로 접근할 때의 최소 권한을 정의합니다.
--
-- 재귀 방지: 멤버십 확인은 SECURITY DEFINER 함수로 감싸 RLS 를 우회합니다.
-- ============================================================================

-- --------------------------------------------------------- helper functions --

create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('moderator', 'admin') from public.users where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.users where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_active_table_member(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.table_members
    where table_id = p_table_id
      and user_id = auth.uid()
      and left_at is null
  );
$$;

create or replace function public.is_session_participant(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.participant_sessions
    where session_id = p_session_id
      and user_id = auth.uid()
      and left_at is null
  );
$$;

-- 현재 사용자와 같은 라이브 세션에 있는 사용자인지 확인합니다.
create or replace function public.shares_live_session_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.participant_sessions me
    join public.participant_sessions other
      on other.session_id = me.session_id
    where me.user_id = auth.uid()
      and me.left_at is null
      and other.user_id = p_user_id
      and other.left_at is null
  );
$$;

-- ------------------------------------------------------------- enable RLS --

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.account_suspensions enable row level security;
alter table public.consents enable row level security;
alter table public.clubs enable row level security;
alter table public.operating_hours enable row level security;
alter table public.tables enable row level security;
alter table public.table_members enable row level security;
alter table public.table_preferences enable row level security;
alter table public.invitations enable row level security;
alter table public.match_proposals enable row level security;
alter table public.matches enable row level security;
alter table public.video_sessions enable row level security;
alter table public.participant_sessions enable row level security;
alter table public.reveal_requests enable row level security;
alter table public.reveal_permissions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.moderation_events enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.waiter_tips enable row level security;
alter table public.waiter_activity enable row level security;
alter table public.session_feedback enable row level security;

-- ------------------------------------------------------------------ users --

create policy users_select_self on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_staff());

-- 역할(role)·상태(status) 자가 변경을 막기 위해 사용자 직접 UPDATE 는 허용하지 않습니다.
-- 온보딩 정보 갱신은 서버 액션(service-role)이 수행합니다.

-- --------------------------------------------------------------- profiles --

create policy profiles_select_self on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- 같은 라이브 세션 참가자의 프로필은 열람할 수 있습니다(닉네임·관심사 표시용).
create policy profiles_select_session_peer on public.profiles
  for select to authenticated
  using (public.shares_live_session_with(user_id));

create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --------------------------------------------------- identity / suspensions --

create policy identity_select_self on public.identity_verifications
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create policy suspensions_select_self on public.account_suspensions
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ---------------------------------------------------------------- consents --

create policy consents_select_self on public.consents
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create policy consents_insert_self on public.consents
  for insert to authenticated
  with check (user_id = auth.uid());

-- ------------------------------------------------------- club / open hours --

-- 운영 정보는 공개 정보입니다.
create policy clubs_select_all on public.clubs
  for select to anon, authenticated using (true);

create policy operating_hours_select_all on public.operating_hours
  for select to anon, authenticated using (true);

-- ----------------------------------------------------------------- tables --

create policy tables_select_member on public.tables
  for select to authenticated
  using (public.is_active_table_member(id) or public.is_staff());

create policy table_members_select on public.table_members
  for select to authenticated
  using (public.is_active_table_member(table_id) or user_id = auth.uid() or public.is_staff());

create policy table_preferences_select on public.table_preferences
  for select to authenticated
  using (public.is_active_table_member(table_id) or public.is_staff());

create policy invitations_select_member on public.invitations
  for select to authenticated
  using (public.is_active_table_member(table_id) or public.is_staff());

-- --------------------------------------------------------------- matching --

create policy match_proposals_select on public.match_proposals
  for select to authenticated
  using (
    public.is_active_table_member(table_a_id)
    or public.is_active_table_member(table_b_id)
    or public.is_staff()
  );

create policy matches_select on public.matches
  for select to authenticated
  using (
    public.is_active_table_member(table_a_id)
    or public.is_active_table_member(table_b_id)
    or public.is_staff()
  );

-- --------------------------------------------------------------- sessions --

create policy video_sessions_select on public.video_sessions
  for select to authenticated
  using (public.is_session_participant(id) or public.is_staff());

create policy participant_sessions_select on public.participant_sessions
  for select to authenticated
  using (public.is_session_participant(session_id) or public.is_staff());

-- ----------------------------------------------------------- mutual reveal --

-- 얼굴 공개 요청은 당사자 두 명만 볼 수 있습니다. 다른 참가자에게 노출되지 않습니다.
create policy reveal_requests_select_party on public.reveal_requests
  for select to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid() or public.is_staff());

create policy reveal_permissions_select_party on public.reveal_permissions
  for select to authenticated
  using (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_staff());

-- ------------------------------------------------------------------- chat --

-- 차단된 메시지는 발신자와 스태프만 볼 수 있습니다.
create policy chat_messages_select on public.chat_messages
  for select to authenticated
  using (
    (
      moderation_status <> 'blocked'
      or sender_id = auth.uid()
      or public.is_staff()
    )
    and (
      (scope = 'table' and public.is_active_table_member(scope_id))
      or (scope = 'room' and public.is_session_participant(scope_id))
      or public.is_staff()
    )
  );

-- ------------------------------------------------------------- moderation --

create policy moderation_events_select_staff on public.moderation_events
  for select to authenticated
  using (public.is_staff() or subject_user_id = auth.uid());

create policy reports_select on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_staff());

create policy reports_insert_self on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

create policy blocks_select_self on public.blocks
  for select to authenticated
  using (blocker_id = auth.uid() or public.is_staff());

create policy blocks_insert_self on public.blocks
  for insert to authenticated
  with check (blocker_id = auth.uid());

create policy blocks_delete_self on public.blocks
  for delete to authenticated
  using (blocker_id = auth.uid());

-- ----------------------------------------------------------------- waiter --

create policy waiter_tips_select on public.waiter_tips
  for select to authenticated
  using (user_id = auth.uid() or public.is_active_table_member(table_id) or public.is_staff());

create policy waiter_activity_select on public.waiter_activity
  for select to authenticated
  using (public.is_active_table_member(table_id) or public.is_staff());

-- --------------------------------------------------------------- feedback --

create policy session_feedback_select_self on public.session_feedback
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create policy session_feedback_insert_self on public.session_feedback
  for insert to authenticated
  with check (user_id = auth.uid());
