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

  const newDateFrom = new Date(dateFrom);
  const newDateTo = new Date(dateTo);

  // Validate date range
  if (newDateFrom > newDateTo) {
    const url = new URL("/trips", req.url);
    url.searchParams.set("error", "invalid_dates");
    url.searchParams.set("countryCode", countryCode);
    url.searchParams.set("dateFrom", dateFrom);
    url.searchParams.set("dateTo", dateTo);
    if (notes) url.searchParams.set("notes", notes);
    return NextResponse.redirect(url);
  }

  // Check for overlapping trips
  const existingTrips = await prisma.trip.findMany({
    where: { user_id: userId },
    select: { id: true, date_from: true, date_to: true, country_code: true }
  });

  for (const trip of existingTrips) {
    // Check if dates overlap (trips share more than just boundary dates)
    if (newDateFrom < trip.date_to && newDateTo > trip.date_from) {
      const formatDate = (date: Date) => {
        const d = date.getUTCDate();
        const m = date.getUTCMonth() + 1;
        const y = date.getUTCFullYear();
        return `${d}/${m}/${y}`;
      };
      const errorMsg = `Trip overlaps with ${trip.country_code} from ${formatDate(trip.date_from)} to ${formatDate(trip.date_to)}`;
      const url = new URL("/trips", req.url);
      url.searchParams.set("error", errorMsg);
      url.searchParams.set("countryCode", countryCode);
      url.searchParams.set("dateFrom", dateFrom);
      url.searchParams.set("dateTo", dateTo);
      if (notes) url.searchParams.set("notes", notes);
      return NextResponse.redirect(url);
    }
  }

  // Ensure country exists in the country table
  await prisma.country.upsert({
    where: { code: countryCode },
    update: {},
    create: { code: countryCode, label: countryCode },
  });

  await prisma.trip.create({
    data: {
      user_id: userId,
      country_code: countryCode,
      date_from: newDateFrom,
      date_to: newDateTo,
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

  // Ensure country exists in the country table
  await prisma.country.upsert({
    where: { code: country_code },
    update: {},
    create: { code: country_code, label: country_code },
  });

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

  // Handle bulk delete (from request body)
  if (!id) {
    try {
      const body = await req.json();
      const { ids } = body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Trip ID(s) required" }, { status: 400 });
      }

      // Verify ownership of all trips
      const existingTrips = await prisma.trip.findMany({
        where: {
          id: { in: ids },
          user_id: userId
        }
      });

      if (existingTrips.length !== ids.length) {
        return NextResponse.json({ error: "Some trips not found or unauthorized" }, { status: 404 });
      }

      // Delete all trips
      await prisma.trip.deleteMany({
        where: {
          id: { in: ids },
          user_id: userId
        }
      });

      return NextResponse.json({ success: true, deleted: ids.length });
    } catch (error) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }

  // Handle single delete (from query param)
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