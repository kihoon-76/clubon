-- ============================================================================
-- ClubOn — 입장료·방 매치 횟수, 그리고 라운지 지역
--
-- 과금의 단위가 바뀝니다.
--
--   이전   30분 이용권을 미리 사 두고, 영상방 하나당 1회를 **방장이** 부담
--   이후   입장료를 내면 **방 매치 5회**를 받고, 방에 들어갈 때 **각자** 1회씩
--
-- 부담 주체가 방장 한 명에서 참가자 각자로 바뀌므로, 차감 기록도 방 단위가
-- 아니라 (방, 사람) 단위여야 합니다. `lounge_usages`는 방의 시간만 들고 있고
-- 누가 얼마나 썼는지는 `session_match_uses`가 맡습니다.
--
-- 회원 등급(VIP)과 우선 매칭 크레딧은 그 등급을 주던 상품(BLACK VIP)이
-- 사라지면서 함께 걷어냅니다. 아무도 채우지 않는 칸을 남겨 두면 나중에
-- 그것이 무슨 뜻이었는지 아무도 모르게 됩니다.
-- ============================================================================

-- --------------------------------------------------------- 매치 횟수 지갑 --

alter table public.pass_wallets
  rename column remaining_passes to remaining_matches;
alter table public.pass_wallets
  rename column total_purchased_passes to total_purchased_matches;

alter table public.pass_wallets
  drop column if exists membership_type,
  drop column if exists priority_matching_credits;

drop type if exists public.membership_type;

comment on column public.pass_wallets.remaining_matches is
  '남은 방 매치 횟수. 입장료로 5회, 추가 구매로 1회씩 늘어납니다.';
comment on column public.pass_wallets.total_purchased_matches is
  '지금까지 구매한 매치 횟수 누계(환불로 줄지 않습니다).';

alter table public.payments
  rename column purchased_passes to purchased_matches;

comment on column public.payments.purchased_matches is
  '이 결제로 지급한 방 매치 횟수. 시간 연장 결제는 0입니다.';

-- ------------------------------------------------- 방 시간 기록 (방 단위) --

-- 차감 수는 더 이상 방에 붙지 않습니다. 방은 "언제 열려 언제까지인지"만
-- 들고 있고, 누가 자기 매치를 썼는지는 아래 session_match_uses가 답합니다.
alter table public.lounge_usages
  drop column if exists deducted_passes;

comment on column public.lounge_usages.user_id is
  '이 방을 연 회원 — 매칭을 요청한 라운지의 방장. 연장 상품의 부담자 판정에 씁니다.';

-- ------------------------------------------------ 매치 차감 (사람 단위) --

-- (방, 사람)이 기본키입니다. 새로고침·재접속으로 같은 사람이 같은 방에
-- 다시 들어와도 두 번 차감되지 않습니다.
create table if not exists public.session_match_uses (
  session_id text not null,
  user_id uuid not null references public.users (id) on delete cascade,
  used_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index if not exists session_match_uses_user_idx
  on public.session_match_uses (user_id, used_at desc);

comment on table public.session_match_uses is
  '누가 어느 방에서 매치 1회를 썼는지. 참가자별 차감의 멱등 근거입니다.';

alter table public.session_match_uses enable row level security;

-- ------------------------------------------------------------ 라운지 지역 --

-- 지역은 매칭 범위를 가릅니다. 코드 값은 src/lib/regions.ts가 단일 출처이며
-- 국내는 'kr-*', 해외는 ISO 3166-1 alpha-2 소문자입니다.
alter table public.tables
  add column if not exists region_code text;

create index if not exists tables_region_idx
  on public.tables (region_code, state);

comment on column public.tables.region_code is
  '라운지 지역 코드. 국내는 kr-seoul 등, 해외는 국가 코드(us, jp …).';
