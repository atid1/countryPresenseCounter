"use client";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const base = isLocalhost
    ? "http://localhost:3000"
    : "https://country-presense-counter.vercel.app"; // project domain only in prod

  const emailRedirectTo = `${base}/auth/hash?redirect_to=/trips`;

  async function sendMagic() {
    setOk(null); setErr(null);

    console.log("Sending magic link with redirect:", emailRedirectTo);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo }
    });

    if (error) setErr(error.message);
    else setOk("Check your email for a sign-in link.");
  }

  return (
    <main style={{ maxWidth: 420, margin: "4rem auto" }}>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />
      <button onClick={sendMagic}>Send Magic Link</button>
      <p style={{fontSize:12, color:"#666", marginTop:8}}>
        Emails will redirect to: <code>{emailRedirectTo}</code>
      </p>
      {ok && <p style={{ color: "green" }}>{ok}</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}
    </main>
  );
}