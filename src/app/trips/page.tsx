export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireUserId } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import TripsTable from "./TripsTable";

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
    <main style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{fontSize: '2rem', fontWeight: 600, marginBottom: '2rem'}}>Trips</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <h2 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>Add Trip</h2>
          <form action="/api/trips" method="post" style={{display:"grid", gap: '1rem'}}>
            <div>
              <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151'}}>
                Country
              </label>
              <select name="countryCode" required
                style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '1rem'}}>
                <option value="">Select a country...</option>
                <option value="IL">Israel (IL)</option>
                <option value="BE">Belgium (BE)</option>
                <option value="RO">Romania (RO)</option>
                <option value="HK">Hong Kong (HK)</option>
                <option value="CA">Canada (CA)</option>
                <option value="ZA">South Africa (ZA)</option>
                <option value="BW">Botswana (BW)</option>
                <option value="AO">Angola (AO)</option>
                <option value="NL">Netherlands (NL)</option>
                <option value="FR">France (FR)</option>
                <option value="DE">Germany (DE)</option>
                <option value="ES">Spain (ES)</option>
                <option value="PT">Portugal (PT)</option>
                <option value="IT">Italy (IT)</option>
                <option value="HU">Hungary (HU)</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151'}}>
                From Date
              </label>
              <input type="date" name="dateFrom" required
                style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '1rem'}} />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151'}}>
                To Date
              </label>
              <input type="date" name="dateTo" required
                style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '1rem'}} />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151'}}>
                Notes (optional)
              </label>
              <input type="text" name="notes"
                style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '1rem'}} />
            </div>
            <button type="submit" style={{
              padding: '0.625rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}>Add Trip</button>
          </form>
        </div>

        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <h2 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>Import / Export</h2>
          <form action="/api/import" method="post" encType="multipart/form-data" style={{marginBottom: '1rem'}}>
            <input type="file" name="file" accept=".csv"
              style={{marginBottom: '0.75rem', fontSize: '0.875rem'}} />
            <button type="submit" style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}>Upload CSV</button>
          </form>
          <a href="/api/export" style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: '#6366f1',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>Export CSV</a>
        </div>
      </div>

      <TripsTable initialMetrics={metrics} />
    </main>
  );
}
