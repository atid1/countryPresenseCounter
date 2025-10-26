"use client";

import { useState } from "react";
import { useLoading } from "./LoadingContext";

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { isLoading: globalLoading, setLoading } = useLoading();

  const handleExport = async () => {
    if (globalLoading) return;

    setIsExporting(true);
    setLoading(true);

    try {
      const response = await fetch("/api/export");

      if (!response.ok) {
        alert("Failed to export CSV");
        setIsExporting(false);
        setLoading(false);
        return;
      }

      // Get the blob data
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trips-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsExporting(false);
      setLoading(false);
    } catch (err) {
      alert("Failed to export CSV");
      setIsExporting(false);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || globalLoading}
      style={{
        display: 'inline-block',
        padding: '0.5rem 1rem',
        background: (isExporting || globalLoading) ? '#9ca3af' : '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: (isExporting || globalLoading) ? 'not-allowed' : 'pointer'
      }}
    >
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}
