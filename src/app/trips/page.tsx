export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireUserId } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import TripsPageClient from "./TripsPageClient";

type TripMetric = {
  id: string;
  user_id: string;
  country_code: string;
  date_from: Date;
  date_to: Date;
  notes: string | null;
  created_at: Date;
  days_inclusive: number;
  gap_to_next_trip: number;
  total_for_location_ytd: number;
  six_month_back_date: Date;
  belgium_last_2_quarters: number | null;
};

function formatDate(date: Date): string {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}


// ...

export default async function TripsPage({
  searchParams,
}: {
  searchParams: { error?: string; countryCode?: string; dateFrom?: string; dateTo?: string; notes?: string };
}) {
  const userId = await requireUserId();

  const error = searchParams.error;
  const prefillCountryCode = searchParams.countryCode || "";
  const prefillDateFrom = searchParams.dateFrom || "";
  const prefillDateTo = searchParams.dateTo || "";
  const prefillNotes = searchParams.notes || "";

  // Fetch from trip_metrics view
  const rawMetrics = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      user_id,
      country_code,
      date_from,
      date_to,
      notes,
      created_at,
      days_inclusive::int as days_inclusive,
      gap_to_next_trip::int as gap_to_next_trip,
      total_for_location_ytd::int as total_for_location_ytd,
      six_month_back_date,
      belgium_last_2_quarters::int as belgium_last_2_quarters
    FROM trip_metrics
    WHERE user_id = ${userId}::uuid
    ORDER BY date_from ASC, date_to ASC
  `;

  const metrics = rawMetrics.map(m => ({
    ...m,
    days_inclusive: Number(m.days_inclusive),
    gap_to_next_trip: Number(m.gap_to_next_trip),
    total_for_location_ytd: Number(m.total_for_location_ytd),
    belgium_last_2_quarters: m.belgium_last_2_quarters ? Number(m.belgium_last_2_quarters) : null
  })) as TripMetric[];

  console.log('[DEBUG] First trip:', metrics[0]);

  // Group trips by year
  const tripsByYear = metrics.reduce((acc, trip) => {
    const year = trip.date_from.getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(trip);
    return acc;
  }, {} as Record<number, TripMetric[]>);

  const years = Object.keys(tripsByYear).map(Number).sort((a, b) => b - a);

  return (
    <TripsPageClient
      metrics={metrics}
      error={error}
      prefillCountryCode={prefillCountryCode}
      prefillDateFrom={prefillDateFrom}
      prefillDateTo={prefillDateTo}
      prefillNotes={prefillNotes}
    />
  );
}
