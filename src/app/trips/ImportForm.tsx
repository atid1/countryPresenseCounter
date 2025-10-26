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
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{marginBottom: '1rem'}}>
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept=".csv"
          disabled={isUploading || globalLoading}
          style={{marginBottom: '0.75rem', fontSize: '0.875rem'}}
        />
        <button
          type="submit"
          disabled={isUploading || globalLoading}
          style={{
            padding: '0.5rem 1rem',
            background: (isUploading || globalLoading) ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: (isUploading || globalLoading) ? 'not-allowed' : 'pointer'
          }}
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
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#dc2626',
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
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ×
              </button>
            </div>

            {/* Error List */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              <p style={{
                marginBottom: '1rem',
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                The following errors were found in your CSV file:
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {errors.map((error, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      borderRadius: '4px',
                      padding: '0.75rem'
                    }}
                  >
                    <div style={{
                      fontWeight: 600,
                      color: '#991b1b',
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      Row {error.row}
                    </div>
                    <div style={{
                      color: '#dc2626',
                      fontSize: '0.875rem'
                    }}>
                      {error.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeDialog}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
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
