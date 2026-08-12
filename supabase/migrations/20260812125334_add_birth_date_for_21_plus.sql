alter table public.users
  add column if not exists birth_date date;

update public.users
set birth_date = make_date(birth_year, 1, 1)
where birth_date is null
  and birth_year between 1900 and extract(year from current_date)::int - 21;

alter table public.users
  drop constraint if exists users_birth_date_21_plus_check;

alter table public.users
  add constraint users_birth_date_21_plus_check
  check (
    birth_date is null
    or birth_date between date '1900-01-01'
      and (current_date - interval '21 years')::date
  );

comment on column public.users.birth_date is
  'Self-declared date of birth. Non-null values must be at least 21 years old.';
