alter table public.trip enable row level security;
alter table public.country enable row level security;

drop policy if exists "trip_select_own" on public.trip;
drop policy if exists "trip_modify_own" on public.trip;
drop policy if exists "trip_update_own" on public.trip;
drop policy if exists "trip_delete_own" on public.trip;
drop policy if exists "country_select_all" on public.country;

create policy "trip_select_own"
  on public.trip for select
  using (auth.uid() = user_id);

create policy "trip_modify_own"
  on public.trip for insert
  with check (auth.uid() = user_id);

create policy "trip_update_own"
  on public.trip for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trip_delete_own"
  on public.trip for delete
  using (auth.uid() = user_id);

create policy "country_select_all"
  on public.country for select
  using (true);
