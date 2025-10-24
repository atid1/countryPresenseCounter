import { requireUserId } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const userId = await requireUserId();
  const trips = await prisma.trip.findMany({ where: { userId }, orderBy: [{ dateFrom: "asc" }, { dateTo: "asc" }] });

  const header = "FROM,TO,LOCATION,NOTES\n";
  const body = trips.map(t =>
    `${t.dateFrom.toISOString().slice(0,10)},${t.dateTo.toISOString().slice(0,10)},${t.countryCode},"${(t.notes??"").replace(/"/g,'""')}"`
  ).join("\n");

  return new Response(header + body, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=trips.csv" }
  });
}
