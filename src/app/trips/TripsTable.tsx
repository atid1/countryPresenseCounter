"use client";

import { useState, useEffect, useRef } from "react";

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
  const [metrics, setMetrics] = useState<TripMetric[]>(initialMetrics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<EditingTrip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const editingRowRef = useRef<HTMLTableRowElement>(null);

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
        return `This trip overlaps with existing trip: ${t.country_code} from ${fromStr} to ${toStr}`;
      }
    }
    return null;
  };

  const saveTrip = async () => {
    if (!editingTrip) return;

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
        return;
      }

      // Refresh the page to get updated calculations
      window.location.reload();
    } catch (err) {
      setError("Failed to save trip");
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;

    try {
      const response = await fetch(`/api/trips?id=${tripId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete trip");
        return;
      }

      // Refresh the page
      window.location.reload();
    } catch (err) {
      alert("Failed to delete trip");
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
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} trip${count > 1 ? 's' : ''}?`)) return;

    try {
      const response = await fetch('/api/trips', {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        alert("Failed to delete trips");
        return;
      }

      // Refresh the page
      window.location.reload();
    } catch (err) {
      alert("Failed to delete trips");
    }
  };

  return (
    <>
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{color: '#1e40af', fontWeight: 500}}>
            {selectedIds.size} trip{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={deleteSelectedTrips}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Delete Selected
          </button>
        </div>
      )}

      {years.map(year => {
        const yearTrips = tripsByYear[year];
        return (
          <div key={year} style={{marginBottom: '3rem'}}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#1f2937'
            }}>{year}</h2>
            <div style={{
              overflowX: 'auto',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              width: '100%'
            }}>
              <table style={{
                width: 'max-content',
                minWidth: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{background: '#f9fafb', borderBottom: '1px solid #e5e7eb'}}>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap', width: '40px'}}>
                      <input
                        type="checkbox"
                        checked={yearTrips.every(t => selectedIds.has(t.id))}
                        onChange={() => toggleSelectAll(yearTrips)}
                        style={{cursor: 'pointer', width: '16px', height: '16px'}}
                      />
                    </th>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap'}}>Location</th>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap'}}>From</th>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap'}}>To</th>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap'}}># Days</th>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap'}}>Total for Location</th>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap'}}>Belgium Last 2Q</th>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', minWidth: '150px'}}>Notes</th>
                    <th style={{padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap'}}>Actions</th>
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
                          style={{borderBottom: '1px solid #f3f4f6', background: '#eff6ff'}}
                        >
                          <td style={{padding: '0.75rem 1rem', textAlign: 'center'}}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(trip.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelectTrip(trip.id);
                              }}
                              style={{cursor: 'pointer', width: '16px', height: '16px'}}
                            />
                          </td>
                          <td style={{padding: '0.75rem 1rem'}}>
                            <select
                              value={editingTrip.country_code}
                              onChange={(e) => setEditingTrip({...editingTrip, country_code: e.target.value})}
                              autoFocus
                              style={{width: '100%', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                            >
                              {COUNTRIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{padding: '0.75rem 1rem'}}>
                            <input
                              type="date"
                              value={editingTrip.date_from}
                              onChange={(e) => setEditingTrip({...editingTrip, date_from: e.target.value})}
                              style={{width: '100%', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                            />
                          </td>
                          <td style={{padding: '0.75rem 1rem'}}>
                            <input
                              type="date"
                              value={editingTrip.date_to}
                              onChange={(e) => setEditingTrip({...editingTrip, date_to: e.target.value})}
                              style={{width: '100%', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                            />
                          </td>
                          <td style={{padding: '0.75rem 1rem', textAlign: 'center'}}>{trip.days_inclusive}</td>
                          <td style={{padding: '0.75rem 1rem', textAlign: 'center'}}>{trip.total_for_location_ytd}</td>
                          <td style={{padding: '0.75rem 1rem', textAlign: 'center'}}>{trip.belgium_last_2_quarters ?? ''}</td>
                          <td style={{padding: '0.75rem 1rem'}}>
                            <input
                              type="text"
                              value={editingTrip.notes}
                              onChange={(e) => setEditingTrip({...editingTrip, notes: e.target.value})}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveTrip();
                                }
                              }}
                              style={{width: '100%', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                            />
                          </td>
                          <td style={{padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap'}}>
                            <button
                              onClick={saveTrip}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                marginRight: '0.25rem'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={trip.id}
                        onClick={() => startEditing(trip)}
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          background: hasRedGap ? '#fee2e2' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!hasRedGap) e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          if (!hasRedGap) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td style={{padding: '0.75rem 1rem', textAlign: 'center'}}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(trip.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectTrip(trip.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{cursor: 'pointer', width: '16px', height: '16px'}}
                          />
                        </td>
                        <td style={{padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap'}}>
                          {trip.country_code}
                          {hasRedGap && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#dc2626',
                              fontWeight: 600,
                              marginTop: '0.25rem'
                            }}>
                              Gap: {gapDays} days
                            </div>
                          )}
                        </td>
                        <td style={{padding: '0.75rem 1rem', whiteSpace: 'nowrap'}}>{formatDate(trip.date_from)}</td>
                        <td style={{padding: '0.75rem 1rem', whiteSpace: 'nowrap'}}>{formatDate(trip.date_to)}</td>
                        <td style={{padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap'}}>{trip.days_inclusive}</td>
                        <td style={{padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap'}}>{trip.total_for_location_ytd}</td>
                        <td style={{padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap'}}>{trip.belgium_last_2_quarters ?? ''}</td>
                        <td style={{padding: '0.75rem 1rem', whiteSpace: 'nowrap', minWidth: '150px'}}>{trip.notes}</td>
                        <td style={{padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap'}}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTrip(trip.id);
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
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
