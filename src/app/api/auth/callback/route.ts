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
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
	} else if (token && type === "magiclink") {
		const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: "magiclink" });
		if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
	} else {
		return NextResponse.redirect(new URL(`/login?error=Missing%20code%20or%20token`, url.origin));
	}

	return NextResponse.redirect(new URL(redirectTo, url.origin));
}