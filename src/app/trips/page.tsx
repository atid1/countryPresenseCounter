export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireUserId } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

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

export default async function TripsPage() {
  const userId = await requireUserId();

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
    <main>
      <h1>Trips</h1>
      <form action="/api/trips" method="post" style={{display:"grid", gap:8, maxWidth:480}}>
        <input type="text" name="countryCode" placeholder="BELGIUM" required />
        <input type="date" name="dateFrom" required />
        <input type="date" name="dateTo" required />
        <input type="text" name="notes" placeholder="notes (optional)" />
        <button type="submit">Add trip</button>
      </form>

      <h2>Import CSV</h2>
      <form action="/api/import" method="post" encType="multipart/form-data">
        <input type="file" name="file" accept=".csv" />
        <button type="submit">Upload CSV</button>
      </form>

      <p><a href="/api/export">Export CSV</a></p>

      {years.map(year => (
        <div key={year} style={{marginTop: 32}}>
          <h2>{year}</h2>
          <table border={1} cellPadding={6} style={{borderCollapse: "collapse"}}>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Gap to Next Trip</th>
                <th># Days</th>
                <th>Total for Location</th>
                <th>Location</th>
                <th>Belgium Last 2 Quarters</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {tripsByYear[year].map(trip => (
                <tr key={trip.id}>
                  <td>{trip.date_from.toISOString().slice(0,10)}</td>
                  <td>{trip.date_to.toISOString().slice(0,10)}</td>
                  <td>{trip.gap_to_next_trip}</td>
                  <td>{trip.days_inclusive}</td>
                  <td>{trip.total_for_location_ytd}</td>
                  <td>{trip.country_code}</td>
                  <td>{trip.belgium_last_2_quarters ?? ''}</td>
                  <td>{trip.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </main>
  );
}
