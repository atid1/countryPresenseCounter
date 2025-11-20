"use client";

import { useState } from "react";
import { useLoading } from "./LoadingContext";

type ExportButtonProps = {
  fullWidth?: boolean;
  variant?: "primary" | "secondary";
};

export default function ExportButton({ fullWidth = true, variant = "primary" }: ExportButtonProps) {
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
      className={`btn ${variant === "secondary" ? "btn-secondary" : "btn-primary"}`}
      style={{
        width: fullWidth ? '100%' : 'auto',
        minWidth: fullWidth ? undefined : '180px',
        padding: fullWidth ? undefined : '0.75rem 1.25rem',
        fontSize: '1rem',
        borderWidth: variant === "secondary" ? '1px' : undefined
      }}
      aria-label="Export trips to CSV"
    >
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}
