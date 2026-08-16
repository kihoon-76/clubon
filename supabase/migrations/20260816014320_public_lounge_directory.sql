alter table public.tables
  add column if not exists lounge_gender text,
  add column if not exists region_text text,
  add column if not exists description text not null default '';

alter table public.tables drop constraint if exists tables_lounge_gender_check;
alter table public.tables add constraint tables_lounge_gender_check
  check (lounge_gender is null or lounge_gender in ('female', 'male'));

update public.tables t
set lounge_gender = case when p.gender::text = 'female' then 'female' else 'male' end,
    region_text = coalesce(nullif(t.region_text, ''), nullif(p.region, ''), t.region_code, '글로벌')
from public.profiles p
where p.user_id = t.host_user_id
  and (t.lounge_gender is null or t.region_text is null or t.region_text = '');

update public.tables set waiter_id = 'dohyun'
where waiter_id is distinct from 'dohyun';

update public.tables
set lounge_gender = 'female',
    region_text = case id
      when 'b2000000-0000-4000-8000-000000000020'::uuid then '서울 성수'
      when 'b2000000-0000-4000-8000-000000000030'::uuid then '서울 한남'
      when 'b2000000-0000-4000-8000-000000000040'::uuid then '서울 청담'
      else '서울 광화문'
    end,
    description = case id
      when 'b2000000-0000-4000-8000-000000000020'::uuid then '음악과 카페 얘기로 가볍게 웃을 분, 오늘 텐션 좋은 테이블이에요.'
      when 'b2000000-0000-4000-8000-000000000030'::uuid then '퇴근 후 와인 한 잔 같은 대화. 센스 있는 농담은 언제나 환영해요.'
      when 'b2000000-0000-4000-8000-000000000040'::uuid then '여행과 전시 이야기 좋아해요. 편하지만 지루하지 않은 자리를 찾습니다.'
      else '책, 미식, 전시 얘기 좋아하는 어른들의 유쾌한 테이블입니다.'
    end,
    waiter_id = 'dohyun', state = 'WAITING'::public.table_state,
    waiting_since = now(), closed_at = null, updated_at = now()
where id in (
  'b2000000-0000-4000-8000-000000000020'::uuid,
  'b2000000-0000-4000-8000-000000000030'::uuid,
  'b2000000-0000-4000-8000-000000000040'::uuid,
  'b2000000-0000-4000-8000-000000000050'::uuid
);

create index if not exists tables_public_lounge_directory_idx
  on public.tables (lounge_gender, updated_at desc)
  where closed_at is null and state in ('FORMING', 'READY', 'WAITING');
