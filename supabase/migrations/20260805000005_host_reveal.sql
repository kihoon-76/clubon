-- ============================================================================
-- ClubOn — 얼굴 공개를 방장 합의 모델로 전환
--   · 기존: 참가자 쌍(pair)이 서로 동의하면 그 두 사람 사이에서만 공개
--   · 변경: 합석한 두 라운지의 방장이 모두 수락하면 방 전체가 한꺼번에 공개
--
-- 세션당 합의는 정확히 1건이며, 결정권은 세션에 고정된 두 방장에게만 있습니다.
-- ============================================================================

-- ---------------------------------------------------------------- sessions --

-- 얼굴 공개를 결정할 수 있는 유일한 두 사람. 세션 개설 시점의 방장을 고정합니다.
-- 방장이 탈퇴해도 세션 기록은 남아야 하므로 on delete set null 입니다.
alter table public.video_sessions
  add column if not exists host_a_user_id uuid references public.users (id) on delete set null,
  add column if not exists host_b_user_id uuid references public.users (id) on delete set null;

-- -------------------------------------------------------- reveal agreement --

do $$ begin
  create type public.reveal_agreement_state as enum (
    'MASKED',
    'REVEAL_REQUESTED',
    'REVEALED',
    'REMASKED',
    'REVEAL_CANCELLED'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.reveal_agreements (
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

create trigger reveal_agreements_touch before update on public.reveal_agreements
  for each row execute function public.touch_updated_at();

alter table public.reveal_agreements enable row level security;

-- 합의 상태는 같은 방의 참가자 전원에게 적용되므로 참가자 전원이 조회합니다.
-- 쓰기는 서버(서버 액션 · service-role)에서만 하며, 방장 여부를 다시 검증합니다.
create policy reveal_agreements_select_participant on public.reveal_agreements
  for select to authenticated
  using (public.is_session_participant(session_id) or public.is_staff());

-- ------------------------------------------------------- 쌍 단위 모델 제거 --

-- 쌍 단위 공개는 더 이상 제품 정책이 아니므로 테이블과 전용 enum을 제거합니다.
-- (Phase 1은 인메모리 런타임으로 동작해 운영 데이터가 없습니다.)
drop table if exists public.reveal_requests;
drop table if exists public.reveal_permissions;
drop type if exists public.reveal_request_state;
drop type if exists public.reveal_permission_state;
