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

    // ✅ Use the actual runtime origin (prod, preview, or localhost)
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback?redirect_to=/trips`
      }
    });

    if (error) setErr(error.message);
    else setOk("Check your email for a sign-in link.");
  }

  return (
    <main>
      <h1>Login</h1>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
      <button onClick={sendMagic}>Send Magic Link</button>
      {ok && <p style={{color:"green"}}>{ok}</p>}
      {err && <p style={{color:"red"}}>{err}</p>}
    </main>
  );
}