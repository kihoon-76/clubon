-- ============================================================================
-- ClubOn — 합석 룸 최소 인원을 4명에서 2명으로 완화
--   · 라운지(테이블)는 1명부터 상대를 찾을 수 있습니다.
--   · 합석 룸은 2명부터 시작하며, 그 아래로 떨어지면 세션이 일시 정지됩니다.
-- ============================================================================

alter table public.clubs
  drop constraint if exists clubs_min_table_size_check,
  drop constraint if exists clubs_min_room_participants_check;

alter table public.clubs
  alter column min_table_size set default 1,
  alter column min_room_participants set default 2;

update public.clubs
  set min_table_size = least(min_table_size, 1),
      min_room_participants = least(min_room_participants, 2);

alter table public.clubs
  add constraint clubs_min_table_size_check check (min_table_size >= 1),
  add constraint clubs_min_room_participants_check check (min_room_participants >= 2);
