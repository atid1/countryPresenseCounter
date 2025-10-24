// src/app/login/page.tsx
"use client";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function sendMagic() {
    setOk(null); setErr(null);

    // Always use the **project** domain in production (not a preview URL)
    const isProd = typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app");
    const projectDomain = "https://country-presense-counter.vercel.app";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = isProd ? projectDomain : origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${base}/api/auth/callback?redirect_to=/trips`
      }
    });

    if (error) setErr(error.message);
    else setOk("Check your email for a sign-in link.");
  }

  return (/* form UI */);
}