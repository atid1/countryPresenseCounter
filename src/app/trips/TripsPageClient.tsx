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
      <main>
        <div className="flex items-center justify-between mb-8">
          <h1>Trips</h1>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '2rem',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {error === 'invalid_dates'
              ? 'End date cannot be before start date'
              : error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="card">
            <h2 className="mb-4">Add Trip</h2>
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

          <div className="card">
            <h2 className="mb-4">Import / Export</h2>
            <div className="flex flex-col gap-4">
              <ImportForm />
              <div className="border-t border-gray-200 pt-4 mt-4">
                <ExportButton />
              </div>
            </div>
          </div>
        </div>

        <TripsTable initialMetrics={metrics} />
      </main>
    </LoadingProvider>
  );
}
