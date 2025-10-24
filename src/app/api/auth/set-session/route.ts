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

		return NextResponse.json({ ok: true, user: data.user ?? null });
	} catch (e: any) {
		console.error("set-session exception:", e?.message || e);
		return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
	}
}