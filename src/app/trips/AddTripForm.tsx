"use client";

import { useState } from "react";
import { useLoading } from "./LoadingContext";

type AddTripFormProps = {
  prefillCountryCode?: string;
  prefillDateFrom?: string;
  prefillDateTo?: string;
  prefillNotes?: string;
  existingTrips: Array<{
    id: string;
    date_from: Date;
    date_to: Date;
    country_code: string;
  }>;
};

export default function AddTripForm({
  prefillCountryCode = "",
  prefillDateFrom = "",
  prefillDateTo = "",
  prefillNotes = "",
  existingTrips,
}: AddTripFormProps) {
  const [dateFrom, setDateFrom] = useState(prefillDateFrom);
  const [dateTo, setDateTo] = useState(prefillDateTo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoading: globalLoading, setLoading } = useLoading();

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateFrom = e.target.value;
    setDateFrom(newDateFrom);
    setError(null); // Clear error when user changes dates

    // If dateTo is empty or before the new dateFrom, set it to a week later
    if (!dateTo || dateTo < newDateFrom) {
      const fromDate = new Date(newDateFrom);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 7);
      setDateTo(toDate.toISOString().slice(0, 10));
    }
  };

  const formatDate = (date: Date): string => {
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const COUNTRIES: Record<string, string> = {
    "IL": "Israel",
    "BE": "Belgium",
    "RO": "Romania",
    "HK": "Hong Kong",
    "CA": "Canada",
    "ZA": "South Africa",
    "BW": "Botswana",
    "AO": "Angola",
    "NL": "Netherlands",
    "FR": "France",
    "DE": "Germany",
    "ES": "Spain",
    "PT": "Portugal",
    "IT": "Italy",
    "HU": "Hungary",
  };

  const getCountryName = (code: string): string => {
    return COUNTRIES[code] || code;
  };

  const checkOverlap = (dateFrom: Date, dateTo: Date): string | null => {
    for (const trip of existingTrips) {
      const otherFrom = trip.date_from.getTime();
      const otherTo = trip.date_to.getTime();
      const newFrom = dateFrom.getTime();
      const newTo = dateTo.getTime();

      // Check if dates overlap (trips share more than just boundary dates)
      if (newFrom < otherTo && newTo > otherFrom) {
        const fromStr = formatDate(trip.date_from);
        const toStr = formatDate(trip.date_to);
        return `This trip overlaps with existing trip: ${getCountryName(trip.country_code)} from ${fromStr} to ${toStr}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (globalLoading) return;

    setError(null);

    const formData = new FormData(e.currentTarget);
    const dateFromValue = String(formData.get("dateFrom"));
    const dateToValue = String(formData.get("dateTo"));

    const newDateFrom = new Date(dateFromValue);
    const newDateTo = new Date(dateToValue);

    // Client-side validation
    if (newDateFrom > newDateTo) {
      setError("End date cannot be before start date");
      return;
    }

    const overlapError = checkOverlap(newDateFrom, newDateTo);
    if (overlapError) {
      setError(overlapError);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setError("Failed to add trip");
        setIsSubmitting(false);
        setLoading(false);
        return;
      }

      // Redirect to trips page (will reload)
      window.location.href = "/trips";
    } catch (err) {
      setError("Failed to add trip");
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '4px',
          padding: '0.75rem',
          color: '#dc2626',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.25rem",
            color: "#374151",
          }}
        >
          Country
        </label>
        <select
          name="countryCode"
          required
          disabled={isSubmitting || globalLoading}
          defaultValue={prefillCountryCode}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        >
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
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.25rem",
            color: "#374151",
          }}
        >
          From Date
        </label>
        <input
          type="date"
          name="dateFrom"
          required
          disabled={isSubmitting || globalLoading}
          value={dateFrom}
          onChange={handleDateFromChange}
          spellCheck={false}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        />
      </div>
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.25rem",
            color: "#374151",
          }}
        >
          To Date
        </label>
        <input
          type="date"
          name="dateTo"
          required
          disabled={isSubmitting || globalLoading}
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setError(null); // Clear error when user changes dates
          }}
          spellCheck={false}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        />
      </div>
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.25rem",
            color: "#374151",
          }}
        >
          Notes (optional)
        </label>
        <input
          type="text"
          name="notes"
          disabled={isSubmitting || globalLoading}
          defaultValue={prefillNotes}
          spellCheck={false}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || globalLoading}
        style={{
          padding: "0.625rem",
          background: (isSubmitting || globalLoading) ? "#9ca3af" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          fontWeight: 500,
          cursor: (isSubmitting || globalLoading) ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "Adding Trip..." : "Add Trip"}
      </button>
    </form>
  );
}
