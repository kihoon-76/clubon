-- ============================================================================
-- ClubOn — 30분 라운지 이용권 · 결제
--
--   · pass_wallets   회원별 잔여 이용권 (잔액의 유일한 진실)
--   · payments       결제 내역. Creem 주문 ID가 기본키 → 웹훅 중복 지급 방지
--   · lounge_usages  이용권을 쓴 기록. (session_id, user_id)가 기본키 →
--                    새로고침·재접속으로 중복 차감되지 않음
--
-- 금액은 최소 화폐 단위 정수(USD면 센트)로 저장합니다. 통화 반올림 오차를
-- 만들지 않기 위해 numeric/float을 쓰지 않습니다.
-- ============================================================================

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_type as enum ('standard', 'vip');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lounge_session_status as enum ('active', 'ended', 'expired');
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------- 이용권 지갑 --

create table if not exists public.pass_wallets (
  user_id uuid primary key references public.users (id) on delete cascade,
  -- 잔액은 음수가 될 수 없습니다. 차감·회수 모두 이 제약으로 한 번 더 막습니다.
  remaining_passes integer not null default 0 check (remaining_passes >= 0),
  membership_type public.membership_type not null default 'standard',
  priority_matching_credits integer not null default 0
    check (priority_matching_credits >= 0),
  total_purchased_passes integer not null default 0
    check (total_purchased_passes >= 0),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------- 결제 내역 --

create table if not exists public.payments (
  -- Creem 주문 식별자. 웹훅이 여러 번 와도 여기서 충돌해 재지급되지 않습니다.
  payment_id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  product_id text not null,
  plan_code text not null,
  amount integer not null check (amount >= 0),
  currency text not null default 'USD',
  purchased_passes integer not null default 0 check (purchased_passes >= 0),
  payment_status public.payment_status not null default 'paid',
  created_at timestamptz not null default now(),
  refunded_at timestamptz
);

create index if not exists payments_user_idx
  on public.payments (user_id, created_at desc);
create index if not exists payments_created_idx
  on public.payments (created_at desc);
create index if not exists payments_plan_idx
  on public.payments (plan_code, payment_status);

-- --------------------------------------------------------- 라운지 이용 기록 --

create table if not exists public.lounge_usages (
  session_id text not null,
  user_id uuid not null references public.users (id) on delete cascade,
  room_id text not null,
  started_at timestamptz not null default now(),
  -- 서버가 정한 만료 시각. 클라이언트 타이머는 이 값만 기준으로 계산합니다.
  expires_at timestamptz not null,
  ended_at timestamptz,
  deducted_passes integer not null default 1 check (deducted_passes >= 0),
  session_status public.lounge_session_status not null default 'active',
  primary key (session_id, user_id)
);

create index if not exists lounge_usages_user_idx
  on public.lounge_usages (user_id, started_at desc);
create index if not exists lounge_usages_started_idx
  on public.lounge_usages (started_at desc);

-- ------------------------------------------------------------------ RLS --

-- 잔액·결제는 서버(서비스 롤)만 다룹니다. 클라이언트 키로는 접근할 수 없게
-- RLS를 켜두고 정책을 두지 않습니다 — 정책이 없으면 기본 거부입니다.
alter table public.pass_wallets enable row level security;
alter table public.payments enable row level security;
alter table public.lounge_usages enable row level security;
