export const runtime = "nodejs";        // 👈 ensures cookie access works
export const dynamic = "force-dynamic"; // 👈 prevents static cache

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";

export async function GET() {
  const userId = await requireUserId();
  const trips = await prisma.trip.findMany({
    where: { user_id: userId },
    orderBy: [{ date_from: "asc" }, { date_to: "asc" }],
  });
  return NextResponse.json(trips);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const form = await req.formData();
  const countryCode = String(form.get("countryCode"));
  const dateFrom = String(form.get("dateFrom"));
  const dateTo = String(form.get("dateTo"));
  const notes = form.get("notes") ? String(form.get("notes")) : undefined;

  await prisma.trip.create({
    data: {
      user_id: userId,
      country_code: countryCode,
      date_from: new Date(dateFrom),
      date_to: new Date(dateTo),
      notes,
    },
  });

  return NextResponse.redirect(new URL("/trips", req.url));
}

export async function PATCH(req: Request) {
  const userId = await requireUserId();
  const body = await req.json();
  const { id, country_code, date_from, date_to, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Trip ID required" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.trip.findFirst({
    where: { id, user_id: userId }
  });

  if (!existing) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Update the trip
  const updated = await prisma.trip.update({
    where: { id },
    data: {
      country_code,
      date_from: new Date(date_from),
      date_to: new Date(date_to),
      notes: notes || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const userId = await requireUserId();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Trip ID required" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.trip.findFirst({
    where: { id, user_id: userId }
  });

  if (!existing) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  await prisma.trip.delete({ where: { id } });

  return NextResponse.json({ success: true });
}