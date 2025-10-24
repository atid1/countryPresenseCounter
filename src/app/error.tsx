"use client";

import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // ship to Vercel logs (and any log drain you’ve set)
    console.error("RSC error:", {
      message: error.message,
      digest: (error as any).digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html>
      <body style={{padding:20}}>
        <h1>Something went wrong</h1>
        <p>If this persists, we’ve been notified.</p>
      </body>
    </html>
  );
}