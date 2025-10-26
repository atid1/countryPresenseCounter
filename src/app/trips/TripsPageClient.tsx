"use client";

import { LoadingProvider } from "./LoadingContext";
import TripsTable from "./TripsTable";
import AddTripForm from "./AddTripForm";
import ImportForm from "./ImportForm";
import ExportButton from "./ExportButton";

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

type TripsPageClientProps = {
  metrics: TripMetric[];
  error?: string;
  prefillCountryCode?: string;
  prefillDateFrom?: string;
  prefillDateTo?: string;
  prefillNotes?: string;
};

export default function TripsPageClient({
  metrics,
  error,
  prefillCountryCode = "",
  prefillDateFrom = "",
  prefillDateTo = "",
  prefillNotes = "",
}: TripsPageClientProps) {
  return (
    <LoadingProvider>
      <main style={{
        maxWidth: '100%',
        padding: '2rem 2rem 2rem 1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <h1 style={{fontSize: '2rem', fontWeight: 600, marginBottom: '2rem'}}>Trips</h1>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            color: '#dc2626',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {error === 'invalid_dates'
              ? 'End date cannot be before start date'
              : error}
          </div>
        )}

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
            <AddTripForm
              prefillCountryCode={prefillCountryCode}
              prefillDateFrom={prefillDateFrom}
              prefillDateTo={prefillDateTo}
              prefillNotes={prefillNotes}
              existingTrips={metrics.map(m => ({
                id: m.id,
                date_from: m.date_from,
                date_to: m.date_to,
                country_code: m.country_code
              }))}
            />
          </div>

          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>Import / Export</h2>
            <ImportForm />
            <ExportButton />
          </div>
        </div>

        <TripsTable initialMetrics={metrics} />
      </main>
    </LoadingProvider>
  );
}
