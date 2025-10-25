export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUserId } from "@/src/lib/auth";
import { parseTripsCsv } from "@/src/lib/csv";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  const userId = await requireUserId();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 });

  const csv = await file.text();
  const rows = parseTripsCsv(csv);

  await prisma.$transaction(
    rows.map(r => prisma.trip.create({
      data: {
        user_id: userId,
        country_code: r.LOCATION.trim(),
        date_from: new Date(r.FROM),
        date_to: new Date(r.TO),
        notes: r.NOTES?.trim()
      }
    }))
  );

  return NextResponse.redirect(new URL("/trips", req.url));
}
