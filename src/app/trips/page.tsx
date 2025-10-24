export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireUserId } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export default async function TripsPage() {
  const userId = await requireUserId();
  const trips = await prisma.trip.findMany({ where: { userId }, orderBy: [{ dateFrom: "asc" }, { dateTo: "asc" }] });

  return (
    <main>
      <h1>Trips</h1>
      <form action="/api/trips" method="post" style={{display:"grid", gap:8, maxWidth:480}}>
        <input type="text" name="countryCode" placeholder="BELGIUM" required />
        <input type="date" name="dateFrom" required />
        <input type="date" name="dateTo" required />
        <input type="text" name="notes" placeholder="notes (optional)" />
        <button type="submit">Add trip</button>
      </form>

      <h2>Import CSV</h2>
      <form action="/api/import" method="post" encType="multipart/form-data">
        <input type="file" name="file" accept=".csv" />
        <button type="submit">Upload CSV</button>
      </form>

      <h2>Existing</h2>
      <table border={1} cellPadding={6}>
        <thead><tr>
          <th>Country</th><th>From</th><th>To</th><th>Notes</th>
        </tr></thead>
        <tbody>
          {trips.map(t=>(
            <tr key={t.id}>
              <td>{t.countryCode}</td>
              <td>{t.dateFrom.toISOString().slice(0,10)}</td>
              <td>{t.dateTo.toISOString().slice(0,10)}</td>
              <td>{t.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p><a href="/api/export">Export CSV</a></p>
    </main>
  );
}
