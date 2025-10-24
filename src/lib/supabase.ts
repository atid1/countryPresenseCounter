import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: any) => cookieStore.set({ name, value: "", ...options })
      },
      headers: {
        "x-forwarded-host": headers().get("x-forwarded-host") ?? undefined,
        "x-forwarded-proto": headers().get("x-forwarded-proto") ?? undefined
      }
    }
  );
}
