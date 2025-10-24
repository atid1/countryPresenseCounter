"use client";
import { useEffect } from "react";

export default function HashCatcher() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const redirect_to = url.searchParams.get("redirect_to") || "/trips";

    // Parse fragment: #access_token=...&refresh_token=...
    const h = new URLSearchParams(window.location.hash.slice(1));
    const access_token = h.get("access_token");
    const refresh_token = h.get("refresh_token");

    async function run() {
      try {
        if (access_token && refresh_token) {
          console.log("[auth/hash] posting tokens to /api/auth/set-session");
          const res = await fetch("/api/auth/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token, refresh_token }),
          });
          console.log("[auth/hash] set-session status:", res.status);
          // Proceed regardless; errors will be logged server-side
          window.location.replace(redirect_to);
        } else if (url.searchParams.has("code") || url.searchParams.has("token")) {
          // Fallback to server callback for query-param style flows
          window.location.replace(`/api/auth/callback${url.search}`);
        } else {
          window.location.replace("/login?error=MissingTokens");
        }
      } catch (e) {
        console.error("[auth/hash] set-session failed", e);
        window.location.replace("/login?error=SetSessionFailed");
      }
    }

    run();
  }, []);

  return <p style={{ padding: 16 }}>Completing sign-in…</p>;
}