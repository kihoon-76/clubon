create extension if not exists pgcrypto with schema extensions;

create table if not exists public.user_presence (
  user_id uuid primary key,
  last_seen_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;
revoke all on table public.user_presence from public, anon, authenticated;

create or replace function public.touch_user_presence(
  p_user_id uuid,
  p_secret text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if encode(extensions.digest(p_secret, 'sha256'), 'hex') <> '52f0754507e6050ab29b889fdf0b935c5446e09ad95fa066c5242ea3cb427737' then
    raise exception 'invalid presence credential';
  end if;

  insert into public.user_presence (user_id, last_seen_at)
  values (p_user_id, now())
  on conflict (user_id)
  do update set last_seen_at = excluded.last_seen_at;

  return true;
end;
$$;

create or replace function public.count_online_users(p_secret text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  online_count integer;
begin
  if encode(extensions.digest(p_secret, 'sha256'), 'hex') <> '52f0754507e6050ab29b889fdf0b935c5446e09ad95fa066c5242ea3cb427737' then
    raise exception 'invalid presence credential';
  end if;

  delete from public.user_presence
  where last_seen_at < now() - interval '1 day';

  select count(*)::integer
  into online_count
  from public.user_presence
  where last_seen_at >= now() - interval '90 seconds';

  return online_count;
end;
$$;

revoke all on function public.touch_user_presence(uuid, text) from public;
revoke all on function public.count_online_users(text) from public;
grant execute on function public.touch_user_presence(uuid, text) to anon;
grant execute on function public.count_online_users(text) to anon;
