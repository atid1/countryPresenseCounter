// src/app/api/debug/session/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabase";

export async function GET() {
	const supabase = supabaseServer();
	const { data: { user }, error } = await supabase.auth.getUser();
	return NextResponse.json({ user, error });
}