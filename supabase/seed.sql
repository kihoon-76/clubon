-- ============================================================================
-- ClubOn — 시드 데이터 (로컬 개발 / 데모 전용)
--
-- 데모 계정 비밀번호는 모두 'clubon-demo-1234' 입니다.
-- 운영 환경에서는 절대 실행하지 마세요.
-- ============================================================================

-- ------------------------------------------------------------------ 클럽 --

insert into public.clubs (id, name, timezone, min_table_size, max_table_size, min_room_participants)
values (
  '11111111-1111-1111-1111-111111111111',
  'ClubOn Seoul',
  'Asia/Seoul',
  2, 4, 4
)
on conflict (id) do nothing;

-- 매일 18:00 ~ 익일 04:00
insert into public.operating_hours (club_id, day_of_week, opens_at, closes_at, closes_next_day)
select '11111111-1111-1111-1111-111111111111', d, time '18:00', time '04:00', true
from generate_series(0, 6) as d
on conflict (club_id, day_of_week) do nothing;

-- -------------------------------------------------------------- 데모 계정 --

do $$
declare
  demo record;
  demo_password text := 'clubon-demo-1234';
  hashed text;
begin
  hashed := crypt(demo_password, gen_salt('bf'));

  for demo in
    select * from (values
      ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'admin@clubon.test',   '관리자',   'admin'::public.user_role,     1988),
      ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'mod@clubon.test',     '모더레이터', 'moderator'::public.user_role, 1990),
      ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, 'hana@clubon.test',    '하나',     'user'::public.user_role,      1994),
      ('aaaaaaaa-0000-0000-0000-000000000004'::uuid, 'doyun@clubon.test',   '도윤',     'user'::public.user_role,      1992),
      ('aaaaaaaa-0000-0000-0000-000000000005'::uuid, 'seoyeon@clubon.test', '서연',     'user'::public.user_role,      1996),
      ('aaaaaaaa-0000-0000-0000-000000000006'::uuid, 'jiho@clubon.test',    '지호',     'user'::public.user_role,      1991),
      ('aaaaaaaa-0000-0000-0000-000000000007'::uuid, 'minseo@clubon.test',  '민서',     'user'::public.user_role,      1995),
      ('aaaaaaaa-0000-0000-0000-000000000008'::uuid, 'taeyang@clubon.test', '태양',     'user'::public.user_role,      1989)
    ) as t(id, email, nickname, role, birth_year)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data
    )
    values (
      '00000000-0000-0000-0000-000000000000', demo.id, 'authenticated', 'authenticated',
      demo.email, hashed, now(), now(), now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nickname', demo.nickname)
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    )
    values (
      gen_random_uuid(), demo.id, demo.id::text, 'email',
      jsonb_build_object('sub', demo.id::text, 'email', demo.email, 'email_verified', true),
      now(), now(), now()
    )
    on conflict (provider, provider_id) do nothing;

    -- 트리거로 생성된 public.users 레코드에 역할/온보딩 상태를 채웁니다.
    update public.users
    set role = demo.role,
        adult_confirmed_at = now(),
        birth_year = demo.birth_year,
        onboarding_completed_at = now()
    where id = demo.id;

    insert into public.profiles (
      user_id, nickname, age_band, region, languages, interests,
      conversation_style, group_vibe, music, travel, hobbies, availability
    )
    values (
      demo.id, demo.nickname,
      case when demo.birth_year >= 1995 then '20대 후반' else '30대 초반' end,
      '서울',
      array['한국어', 'English'],
      array['여행', '음악', '영화'],
      '차분하게 듣는 편',
      'balanced',
      array['재즈', '인디'],
      array['도쿄', '리스본'],
      array['러닝', '전시 관람'],
      array['평일 저녁', '주말 밤']
    )
    on conflict (user_id) do nothing;

    -- 필수 동의 항목 전체 기록
    insert into public.consents (user_id, consent_type, version, granted, ip_hash, device_id)
    select demo.id, t, 'v1', true, 'seed-ip-hash', 'seed-device'
    from unnest(enum_range(null::public.consent_type)) as t;

    insert into public.identity_verifications (user_id, method, status, provider_ref, verified_at)
    values (demo.id, 'email', 'verified', 'seed-mock-ref', now());
  end loop;
end $$;
