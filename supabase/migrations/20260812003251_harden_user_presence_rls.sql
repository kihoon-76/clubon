grant select, insert, update, delete on public.user_presence to anon, authenticated;

create policy user_presence_secret_select
on public.user_presence for select
to anon, authenticated
using (
  encode(extensions.digest(coalesce((select current_setting('clubon.presence_secret', true)), ''), 'sha256'), 'hex')
  = '52f0754507e6050ab29b889fdf0b935c5446e09ad95fa066c5242ea3cb427737'
);

create policy user_presence_secret_insert
on public.user_presence for insert
to anon, authenticated
with check (
  encode(extensions.digest(coalesce((select current_setting('clubon.presence_secret', true)), ''), 'sha256'), 'hex')
  = '52f0754507e6050ab29b889fdf0b935c5446e09ad95fa066c5242ea3cb427737'
);

create policy user_presence_secret_update
on public.user_presence for update
to anon, authenticated
using (
  encode(extensions.digest(coalesce((select current_setting('clubon.presence_secret', true)), ''), 'sha256'), 'hex')
  = '52f0754507e6050ab29b889fdf0b935c5446e09ad95fa066c5242ea3cb427737'
)
with check (
  encode(extensions.digest(coalesce((select current_setting('clubon.presence_secret', true)), ''), 'sha256'), 'hex')
  = '52f0754507e6050ab29b889fdf0b935c5446e09ad95fa066c5242ea3cb427737'
);

create policy user_presence_secret_delete
on public.user_presence for delete
to anon, authenticated
using (
  encode(extensions.digest(coalesce((select current_setting('clubon.presence_secret', true)), ''), 'sha256'), 'hex')
  = '52f0754507e6050ab29b889fdf0b935c5446e09ad95fa066c5242ea3cb427737'
);

create or replace function public.touch_user_presence(
  p_user_id uuid,
  p_secret text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform set_config('clubon.presence_secret', p_secret, true);

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
security invoker
set search_path = ''
as $$
declare
  online_count integer;
begin
  perform set_config('clubon.presence_secret', p_secret, true);

  delete from public.user_presence
  where last_seen_at < now() - interval '1 day';

  select count(*)::integer
  into online_count
  from public.user_presence
  where last_seen_at >= now() - interval '90 seconds';

  return online_count;
end;
$$;
