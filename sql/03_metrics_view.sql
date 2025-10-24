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
  from y y
),
belgium_q as (
  select
    s.*,
    (date_trunc('quarter', s.date_to) - interval '6 months')::date as q2_start,
    (date_trunc('quarter', s.date_to) - interval '1 day')::date    as q0_end
  from six_back s
),
belgium_sum as (
  select
    b.*,
    case when b.country_code = 'BELGIUM' then (
      select coalesce(sum(
        greatest(0, least(bt.date_to, b.q0_end) - greatest(bt.date_from, b.q2_start) + 1)
      ),0)
      from public.trip bt
      where bt.user_id = b.user_id
        and bt.country_code = 'BELGIUM'
    ) else null end as belgium_last_2_quarters
  from belgium_q b
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
