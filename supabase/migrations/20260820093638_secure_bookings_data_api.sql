-- Bookings are an internal server-side matching record. They must never be
-- reachable through the public Supabase Data API.
alter table public.bookings enable row level security;

revoke all privileges on table public.bookings from anon, authenticated;

comment on table public.bookings is
  'Internal matching records. Access is limited to trusted server/database roles.';
