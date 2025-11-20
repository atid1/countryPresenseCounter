"use client";

import { useState, useRef } from "react";
import { useLoading } from "./LoadingContext";

type ImportError = {
  row: number;
  message: string;
};

export default function ImportForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<ImportError[] | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading: globalLoading, setLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (globalLoading) return;

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;

    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    setIsUploading(true);
    setLoading(true);
    setErrors(null);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch (parseErr) {
        // If the response is not JSON, fall through to generic handling
      }

      const data = payload as { success?: boolean; error?: string; errors?: ImportError[] } | null;

      if (data && data.success === false) {
        if (Array.isArray(data.errors)) {
          setErrors(data.errors);
          setShowErrorDialog(true);
        } else {
          alert(data.error || "Failed to import CSV");
        }
        setIsUploading(false);
        setLoading(false);
        return;
      }

      if (data && data.success === true) {
        window.location.href = "/trips";
        return;
      }

      if (!response.ok) {
        alert(data?.error || "Failed to import CSV");
        setIsUploading(false);
        setLoading(false);
        return;
      }

      window.location.href = "/trips";
    } catch (err) {
      alert("Failed to upload CSV");
      setIsUploading(false);
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setShowErrorDialog(false);
    setErrors(null);
    setHasFile(false);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept=".csv"
          onChange={(e) => setHasFile(!!e.target.files?.length)}
          disabled={isUploading || globalLoading}
          className="block w-full text-sm text-slate-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          style={{ marginBottom: '0.75rem' }}
        />
        <button
          type="submit"
          disabled={!hasFile || isUploading || globalLoading}
          className="btn btn-primary"
        >
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </form>

      {/* Error Dialog */}
      {showErrorDialog && errors && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeDialog}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          />

          {/* Dialog */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }} className="card">
            {/* Header */}
            <div style={{
              borderBottom: '1px solid var(--border)',
              paddingBottom: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                color: 'var(--danger)',
                margin: 0
              }}>
                CSV Import Errors
              </h2>
              <button
                onClick={closeDialog}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Error List */}
            <div style={{
              overflowY: 'auto',
              flex: 1,
              paddingRight: '0.5rem'
            }}>
              <p className="text-sm text-muted mb-4">
                The following errors were found in your CSV file:
              </p>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Row</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((error, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>Row {error.row}</td>
                        <td style={{ color: 'var(--danger)' }}>{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeDialog}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
