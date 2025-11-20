"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "./LoadingContext";

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

type EditingTrip = {
  id: string;
  country_code: string;
  date_from: string; // ISO string for input[type=date]
  date_to: string;
  notes: string;
};

const COUNTRIES = [
  { code: "IL", name: "Israel" },
  { code: "BE", name: "Belgium" },
  { code: "RO", name: "Romania" },
  { code: "HK", name: "Hong Kong" },
  { code: "CA", name: "Canada" },
  { code: "ZA", name: "South Africa" },
  { code: "BW", name: "Botswana" },
  { code: "AO", name: "Angola" },
  { code: "NL", name: "Netherlands" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" },
  { code: "HU", name: "Hungary" },
];

// Create a mapping from country code to country name
const COUNTRY_MAP: Record<string, string> = COUNTRIES.reduce((acc, country) => {
  acc[country.code] = country.name;
  return acc;
}, {} as Record<string, string>);

function getCountryName(code: string): string {
  return COUNTRY_MAP[code] || code;
}

function formatDate(date: Date): string {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function hasGap(currentTrip: TripMetric, nextTrip: TripMetric | undefined): boolean {
  if (!nextTrip) return false;
  const daysDiff = Math.floor((nextTrip.date_from.getTime() - currentTrip.date_to.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 1;
}

function getGapDays(currentTrip: TripMetric, nextTrip: TripMetric | undefined): number {
  if (!nextTrip) return 0;
  return Math.floor((nextTrip.date_from.getTime() - currentTrip.date_to.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TripsTable({ initialMetrics }: { initialMetrics: TripMetric[] }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<TripMetric[]>(initialMetrics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<EditingTrip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const editingRowRef = useRef<HTMLTableRowElement>(null);
  const { isLoading: globalLoading, setLoading } = useLoading();

  // Update metrics when initialMetrics changes (after router.refresh())
  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  // Handle clicking outside the editing row
  useEffect(() => {
    if (!editingId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (editingRowRef.current && !editingRowRef.current.contains(event.target as Node)) {
        saveTrip();
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingId, editingTrip]); // Re-run when editing state changes

  // Group trips by year
  const tripsByYear = metrics.reduce((acc, trip) => {
    const year = trip.date_from.getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(trip);
    return acc;
  }, {} as Record<number, TripMetric[]>);

  const years = Object.keys(tripsByYear).map(Number).sort((a, b) => b - a);

  const startEditing = (trip: TripMetric) => {
    if (isSaving || deletingId || isDeletingSelected) return;
    setEditingId(trip.id);
    setEditingTrip({
      id: trip.id,
      country_code: trip.country_code,
      date_from: toInputDate(trip.date_from),
      date_to: toInputDate(trip.date_to),
      notes: trip.notes || "",
    });
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTrip(null);
    setError(null);
  };

  const checkOverlap = (tripId: string, dateFrom: Date, dateTo: Date): string | null => {
    for (const t of metrics) {
      if (t.id === tripId) continue; // Skip the trip being edited

      const otherFrom = t.date_from.getTime();
      const otherTo = t.date_to.getTime();
      const newFrom = dateFrom.getTime();
      const newTo = dateTo.getTime();

      // Allow adjacent trips (one ends when another starts)
      // Only overlap if they share more than just a boundary date
      if (newFrom < otherTo && newTo > otherFrom) {
        const fromStr = formatDate(t.date_from);
        const toStr = formatDate(t.date_to);
        return `This trip overlaps with existing trip: ${getCountryName(t.country_code)} from ${fromStr} to ${toStr}`;
      }
    }
    return null;
  };

  const saveTrip = async () => {
    if (!editingTrip || isSaving || globalLoading) return;

    // Check if changes were made
    const originalTrip = metrics.find(t => t.id === editingTrip.id);
    if (originalTrip) {
      const originalDateFrom = toInputDate(originalTrip.date_from);
      const originalDateTo = toInputDate(originalTrip.date_to);
      const originalNotes = originalTrip.notes || "";

      if (
        originalTrip.country_code === editingTrip.country_code &&
        originalDateFrom === editingTrip.date_from &&
        originalDateTo === editingTrip.date_to &&
        originalNotes === editingTrip.notes
      ) {
        cancelEditing();
        return;
      }
    }

    const dateFrom = new Date(editingTrip.date_from);
    const dateTo = new Date(editingTrip.date_to);

    // Validation
    if (dateFrom > dateTo) {
      setError("End date cannot be before start date");
      return;
    }

    const overlapError = checkOverlap(editingTrip.id, dateFrom, dateTo);
    if (overlapError) {
      setError(overlapError);
      return;
    }

    setIsSaving(true);
    setLoading(true);

    try {
      const response = await fetch("/api/trips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTrip.id,
          country_code: editingTrip.country_code,
          date_from: editingTrip.date_from,
          date_to: editingTrip.date_to,
          notes: editingTrip.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update trip");
        setIsSaving(false);
        setLoading(false);
        return;
      }

      // Refresh the page to get updated calculations
      window.location.reload();
    } catch (err) {
      setError("Failed to save trip");
      setIsSaving(false);
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (deletingId || isDeletingSelected || globalLoading) return;
    if (!confirm("Are you sure you want to delete this trip?")) return;

    setDeletingId(tripId);
    setLoading(true);

    try {
      const response = await fetch(`/api/trips?id=${tripId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete trip");
        setDeletingId(null);
        setLoading(false);
        return;
      }

      // Refresh the page
      window.location.reload();
    } catch (err) {
      alert("Failed to delete trip");
      setDeletingId(null);
      setLoading(false);
    }
  };

  const toggleSelectTrip = (tripId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(tripId)) {
      newSelected.delete(tripId);
    } else {
      newSelected.add(tripId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = (yearTrips: TripMetric[]) => {
    const yearTripIds = yearTrips.map(t => t.id);
    const allSelected = yearTripIds.every(id => selectedIds.has(id));

    const newSelected = new Set(selectedIds);
    if (allSelected) {
      yearTripIds.forEach(id => newSelected.delete(id));
    } else {
      yearTripIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const deleteSelectedTrips = async () => {
    if (selectedIds.size === 0 || isDeletingSelected || deletingId || globalLoading) return;

    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} trip${count > 1 ? 's' : ''}?`)) return;

    setIsDeletingSelected(true);
    setLoading(true);

    try {
      const response = await fetch('/api/trips', {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        alert("Failed to delete trips");
        setIsDeletingSelected(false);
        setLoading(false);
        return;
      }

      // Refresh the page
      window.location.reload();
    } catch (err) {
      alert("Failed to delete trips");
      setIsDeletingSelected(false);
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div style={{
          background: 'var(--danger-light)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: 'var(--danger)'
        }}>
          {error}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div style={{
          background: 'var(--primary-light)',
          border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ color: 'var(--primary-hover)', fontWeight: 500 }}>
            {selectedIds.size} trip{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={deleteSelectedTrips}
            disabled={isDeletingSelected || deletingId !== null || isSaving}
            className="btn btn-danger"
          >
            {isDeletingSelected ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      {years.map(year => {
        const yearTrips = tripsByYear[year];
        return (
          <div key={year} className="mb-12">
            <h2 className="mb-4">{year}</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={yearTrips.every(t => selectedIds.has(t.id))}
                        onChange={() => toggleSelectAll(yearTrips)}
                        spellCheck={false}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Location</th>
                    <th style={{ width: '140px' }}>From</th>
                    <th style={{ width: '140px' }}>To</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Days</th>
                    <th style={{ width: '65px', textAlign: 'center' }}>Total YTD</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>BE 2Q</th>
                    <th style={{ width: '400px' }}>Notes</th>
                    <th style={{ width: '180px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {yearTrips.map((trip, index) => {
                    const isEditing = editingId === trip.id;
                    const nextTrip = yearTrips[index + 1];
                    const hasRedGap = hasGap(trip, nextTrip);
                    const gapDays = getGapDays(trip, nextTrip);

                    if (isEditing && editingTrip) {
                      return (
                        <tr
                          ref={editingRowRef}
                          key={trip.id}
                          style={{ background: 'var(--surface-hover)' }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(trip.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelectTrip(trip.id);
                              }}
                              spellCheck={false}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </td>
                          <td>
                            <select
                              value={editingTrip.country_code}
                              onChange={(e) => setEditingTrip({ ...editingTrip, country_code: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveTrip();
                                }
                              }}
                              autoFocus
                              className="select"
                              style={{ padding: '0.25rem' }}
                            >
                              {COUNTRIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="date"
                              value={editingTrip.date_from}
                              onChange={(e) => {
                                setEditingTrip({ ...editingTrip, date_from: e.target.value });
                                setError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveTrip();
                                }
                              }}
                              spellCheck={false}
                              className="input"
                              style={{ padding: '0.25rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={editingTrip.date_to}
                              onChange={(e) => {
                                setEditingTrip({ ...editingTrip, date_to: e.target.value });
                                setError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveTrip();
                                }
                              }}
                              spellCheck={false}
                              className="input"
                              style={{ padding: '0.25rem' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>{trip.days_inclusive}</td>
                          <td style={{ textAlign: 'center' }}>{trip.total_for_location_ytd}</td>
                          <td style={{ textAlign: 'center' }}>{trip.belgium_last_2_quarters ?? ''}</td>
                          <td>
                            <input
                              type="text"
                              value={editingTrip.notes}
                              onChange={(e) => setEditingTrip({ ...editingTrip, notes: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveTrip();
                                }
                              }}
                              spellCheck={false}
                              className="input"
                              style={{ padding: '0.25rem' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={saveTrip}
                                disabled={isSaving || deletingId !== null || isDeletingSelected}
                                className="btn btn-primary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                {isSaving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEditing}
                                disabled={isSaving || deletingId !== null || isDeletingSelected}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={trip.id}
                        onClick={() => startEditing(trip)}
                        style={{
                          cursor: 'pointer',
                          background: hasRedGap ? 'var(--danger-light)' : undefined
                        }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(trip.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectTrip(trip.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            spellCheck={false}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {getCountryName(trip.country_code)}
                          {hasRedGap && (
                            <div className="badge badge-red" style={{ marginTop: '0.25rem' }}>
                              Gap: {gapDays} days
                            </div>
                          )}
                        </td>
                        <td>{formatDate(trip.date_from)}</td>
                        <td>{formatDate(trip.date_to)}</td>
                        <td style={{ textAlign: 'center' }}>{trip.days_inclusive}</td>
                        <td style={{ textAlign: 'center' }}>{trip.total_for_location_ytd}</td>
                        <td style={{ textAlign: 'center' }}>{trip.belgium_last_2_quarters ?? ''}</td>
                        <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.notes}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTrip(trip.id);
                            }}
                            disabled={deletingId !== null || isDeletingSelected || isSaving}
                            className="btn btn-danger-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            {deletingId === trip.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
