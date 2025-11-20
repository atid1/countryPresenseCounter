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
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Trips</h1>
            <p className="text-muted" style={{ fontSize: '1rem' }}>
              Add or import your travel days, then review and export the table below.
            </p>
          </div>
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

        <section
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2.75rem',
            alignItems: 'start',
            marginBottom: '3rem'
          }}
        >
          <div className="card">
            <h2 className="mb-4" style={{ marginBottom: '0.35rem' }}>Add Trip</h2>
            <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
              Enter a new stay with clear dates and notes. We will warn you if dates overlap.
            </p>
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
            <h2 className="mb-4" style={{ marginBottom: '0.35rem' }}>Import from CSV</h2>
            <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              Upload your saved CSV file. We will flag any row that needs attention before saving.
            </p>
            <ImportForm />
            <p className="text-muted" style={{ fontSize: '0.95rem', marginTop: '0.75rem' }}>
              Tip: export a copy first if you want a template for the columns.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <div
            className="flex items-center justify-between mb-4"
            style={{ gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}
          >
            <div>
              <h2 style={{ marginBottom: '0.35rem' }}>Review &amp; Export</h2>
              <p className="text-muted" style={{ fontSize: '1rem' }}>
                Tap a row to edit or delete it. Export (optional) downloads exactly what you see in the table.
              </p>
            </div>
            <ExportButton fullWidth={false} variant="secondary" />
          </div>

          <TripsTable initialMetrics={metrics} />
        </section>
      </main>
    </LoadingProvider>
  );
}
