export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabase";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const code = url.searchParams.get("code");
	const token = url.searchParams.get("token");
	const type = url.searchParams.get("type");
	const redirectTo = url.searchParams.get("redirect_to") || "/trips";

	const supabase = supabaseServer();

	if (code) {
		// OAuth / PKCE
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) {
			console.error("exchangeCodeForSession error:", error.message);
			return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
		}
	} else if (token && type === "magiclink") {
		// Magic link flow
		const { data, error } = await supabase.auth.verifyOtp({ token_hash: token, type: "magiclink" });
		if (error) {
			console.error("verifyOtp error:", error.message);
			return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
		}
	}

	return NextResponse.redirect(new URL(redirectTo, url.origin));
}