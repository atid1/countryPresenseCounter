create extension if not exists "uuid-ossp";

drop table if exists public.trip cascade;
drop table if exists public.country cascade;

create table public.country (
  code text primary key,
  label text not null
);

insert into public.country (code, label) values
  ('BELGIUM','Belgium'),
  ('ISRAEL','Israel')
on conflict do nothing;

create table public.trip (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  country_code text not null references public.country(code),
  date_from date not null,
  date_to   date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint chk_dates check (date_to >= date_from)
);

create index if not exists idx_trip_user_from on public.trip (user_id, date_from);
