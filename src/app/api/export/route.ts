export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireUserId } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const userId = await requireUserId();
  const trips = await prisma.trip.findMany({ where: { user_id: userId }, orderBy: [{ date_from: "asc" }, { date_to: "asc" }] });

  const header = "FROM,TO,LOCATION,NOTES\n";
  const body = trips.map(t =>
    `${t.date_from.toISOString().slice(0, 10)},${t.date_to.toISOString().slice(0, 10)},${t.country_code},"${(t.notes ?? "").replace(/"/g, '""')}"`
  ).join("\n");

  return new Response(header + body, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=trips.csv" }
  });
}
