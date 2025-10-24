export const runtime = "nodejs";        // 👈 ensures cookie access works
export const dynamic = "force-dynamic"; // 👈 prevents static cache

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { supabaseServer } from "@/src/lib/supabase";

async function getUserId() {
  const supabase = supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export async function GET() {
  const userId = await getUserId();
  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: [{ dateFrom: "asc" }, { dateTo: "asc" }],
  });
  return NextResponse.json(trips);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const form = await req.formData();
  const countryCode = String(form.get("countryCode"));
  const dateFrom = String(form.get("dateFrom"));
  const dateTo = String(form.get("dateTo"));
  const notes = form.get("notes") ? String(form.get("notes")) : undefined;

  await prisma.trip.create({
    data: {
      userId,
      countryCode,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      notes,
    },
  });

  return NextResponse.redirect(new URL("/trips", req.url));
}