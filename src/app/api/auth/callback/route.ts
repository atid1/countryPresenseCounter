// src/app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabase";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const redirectTo = url.searchParams.get("redirect_to") || "/";

	const supabase = supabaseServer();

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) {
			console.error("exchangeCodeForSession error:", error.message);
			return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
		}
	}

	return NextResponse.redirect(new URL(redirectTo, url.origin));
}