export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabase";

export async function POST(req: Request) {
	try {
		const { access_token, refresh_token } = await req.json();

		if (!access_token || !refresh_token) {
			return NextResponse.json({ ok: false, error: "Missing tokens" }, { status: 400 });
		}

		const supabase = supabaseServer();
		const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

		if (error) {
			console.error("setSession error:", error.message);
			return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
		}

		// Also set cookies explicitly to ensure they stick on Vercel/Next route handlers
		const res = NextResponse.json({ ok: true, user: data.user ?? null });

		// Derive expiry if available
		const exp = data.session?.expires_at ? new Date(data.session.expires_at * 1000) : undefined;

		res.cookies.set({
			name: "sb-access-token",
			value: access_token,
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			...(exp ? { expires: exp } : {})
		});

		res.cookies.set({
			name: "sb-refresh-token",
			value: refresh_token,
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/"
		});

		return res;
	} catch (e: any) {
		console.error("set-session exception:", e?.message || e);
		return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
	}
}