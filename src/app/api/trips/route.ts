import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUserId } from "@/src/lib/auth";

export async function GET() {
  const userId = await requireUserId();
  const trips = await prisma.trip.findMany({ where: { userId }, orderBy: [{ dateFrom: "asc" }, { dateTo: "asc" }] });
  return NextResponse.json(trips);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const form = await req.formData();
  const countryCode = String(form.get("countryCode"));
  const dateFrom = String(form.get("dateFrom"));
  const dateTo   = String(form.get("dateTo"));
  const notes    = form.get("notes") ? String(form.get("notes")) : undefined;

  await prisma.trip.create({
    data: { userId, countryCode, dateFrom: new Date(dateFrom), dateTo: new Date(dateTo), notes }
  });

  return NextResponse.redirect(new URL("/trips", req.url));
}
