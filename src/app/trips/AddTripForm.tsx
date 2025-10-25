"use client";

import { useState } from "react";

type AddTripFormProps = {
  prefillCountryCode?: string;
  prefillDateFrom?: string;
  prefillDateTo?: string;
  prefillNotes?: string;
};

export default function AddTripForm({
  prefillCountryCode = "",
  prefillDateFrom = "",
  prefillDateTo = "",
  prefillNotes = "",
}: AddTripFormProps) {
  const [dateFrom, setDateFrom] = useState(prefillDateFrom);
  const [dateTo, setDateTo] = useState(prefillDateTo);

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateFrom = e.target.value;
    setDateFrom(newDateFrom);

    // If dateTo is empty or before the new dateFrom, set it to a week later
    if (!dateTo || dateTo < newDateFrom) {
      const fromDate = new Date(newDateFrom);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 7);
      setDateTo(toDate.toISOString().slice(0, 10));
    }
  };

  return (
    <form action="/api/trips" method="post" style={{ display: "grid", gap: "1rem" }}>
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
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
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
        style={{
          padding: "0.625rem",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Add Trip
      </button>
    </form>
  );
}
