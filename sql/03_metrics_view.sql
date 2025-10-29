drop view if exists public.trip_metrics cascade;

create view public.trip_metrics as
with base as (
  select
    t.*,
    (t.date_to - t.date_from + 1)           as days_inclusive,
    date_trunc('year', t.date_from)::date   as year_key
  from public.trip t
),
next_trip as (
  select
    b.id,
    lead(b.date_from) over (partition by b.user_id order by b.date_from, b.date_to) as next_from
  from base b
),
gap_calc as (
  select
    b.*,
    greatest(0, coalesce(nt.next_from - b.date_to - 1, 0)) as gap_to_next_trip
  from base b
  left join next_trip nt on nt.id = b.id
),
ytd as (
  select
    g.*,
    sum(days_inclusive) over (
      partition by user_id, country_code, year_key
      order by date_from, date_to
      rows between unbounded preceding and current row
    ) as total_for_location_ytd
  from gap_calc g
),
six_back as (
  select
    y.*,
    (y.date_to - interval '6 months')::date as six_month_back_date
  from ytd as y
),
belgium_calc as (
  select
    s.*,
    -- Calculate start date: max of (6 months before trip end, or Jan 1 of same year)
    greatest(
      (s.date_to - interval '6 months')::date,
      date_trunc('year', s.date_to)::date
    ) as belgium_window_start
  from six_back s
),
belgium_sum as (
  select
    b.*,
    case when b.country_code IN ('BELGIUM', 'BE') then (
      select coalesce(sum(
        -- Calculate overlap between trip and the window
        greatest(0, least(bt.date_to, b.date_to) - greatest(bt.date_from, b.belgium_window_start) + 1)
      ),0)
      from public.trip bt
      where bt.user_id = b.user_id
        and bt.country_code IN ('BELGIUM', 'BE')
        and bt.date_from <= b.date_to  -- Trip starts before or during current trip end
        and bt.date_to >= b.belgium_window_start  -- Trip ends after or during window start
    ) else null end as belgium_last_2_quarters
  from belgium_calc b
)
select
  id,
  user_id,
  country_code,
  date_from,
  date_to,
  notes,
  created_at,
  days_inclusive,
  gap_to_next_trip,
  total_for_location_ytd,
  six_month_back_date,
  belgium_last_2_quarters
from belgium_sum;

alter view public.trip_metrics
  set (security_invoker = true);
