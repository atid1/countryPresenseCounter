"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL
  ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");


export default function Login() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendMagic() {
    setOk(null);
    setErr(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${SITE_URL}/api/auth/callback?redirect_to=/trips`
      }
    });

    if (error) setErr(error.message);
    else setOk("Check your email for a sign-in link.");
  }

  return (
    <main>
      <h1>Login</h1>
      <input
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button onClick={sendMagic}>Send Magic Link</button>
      {ok && <p style={{ color: "green" }}>{ok}</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}
    </main>
  );
}