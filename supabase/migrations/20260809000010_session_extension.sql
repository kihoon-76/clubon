-- ============================================================================
-- ClubOn — 시간 연장(추가 과금) 이행
--
-- 연장은 이용권을 쓰지 않습니다. 돈을 받고 **그 방의 만료 시각**을 뒤로 미는
-- 상품이므로, 무엇을 얼마나 제공했는지는 이용권 수가 아니라 분(minute) 단위로
-- 남겨야 합니다.
--
--   · extended_minutes  결제로 늘어난 시간의 누계(분)
--
-- 연장 적용은 결제 기록(payments) 삽입과 같은 트랜잭션에서 일어납니다. 중복
-- 웹훅은 payment_id 기본키에서 막히므로 시간도 두 번 늘어나지 않습니다.
-- ============================================================================

alter table public.lounge_usages
  add column if not exists extended_minutes integer not null default 0
    check (extended_minutes >= 0);

comment on column public.lounge_usages.extended_minutes is
  '결제로 늘어난 시간의 누계(분). 이용권 차감과 무관한 별도 과금분입니다.';

comment on column public.lounge_usages.expires_at is
  '만료 시각. 연장 결제 시 greatest(expires_at, now())에 산 시간을 더합니다.';
