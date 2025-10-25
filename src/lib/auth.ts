export const dynamic = "force-dynamic";

import { supabaseServer } from "./supabase";

export async function requireUserId() {
  // Bypass authentication for localhost development
  if (process.env.NODE_ENV === "development") {
    console.log("[auth] Development mode: using test user ID");
    return "00000000-0000-0000-0000-000000000000"; // Test UUID for local dev
  }

  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}
