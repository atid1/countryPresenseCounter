export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUserId } from "@/src/lib/auth";
import { parseTripsCsv } from "@/src/lib/csv";
import { prisma } from "@/src/lib/prisma";

/**
 * Helper: get first defined value from an object by a list of candidate keys
 */
function firstVal(row: Record<string, unknown>, candidates: string[]) {
  for (const k of candidates) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return undefined;
}

/**
 * Helper: parse a date string into a Date (supports YYYY-MM-DD and common variants)
 */
function parseDateLike(s: string | undefined) {
  if (!s) return undefined;
  const t = String(s).trim();

  // Normalize common separators
  const isoish = t.replace(/\./g, "-").replace(/\//g, "-");

  // Try ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(isoish)) {
    const d = new Date(isoish + "T00:00:00Z");
    if (!isNaN(d.getTime())) return d;
  }

  // Try DD-MM-YYYY
  const m = isoish.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const d = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T00:00:00Z`);
    if (!isNaN(d.getTime())) return d;
  }

  // Last resort: native Date
  const d = new Date(t);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Normalize country inputs to 2-letter ISO if possible */
function normalizeCountry(input: string | undefined) {
  if (!input) return undefined;
  const raw = String(input).trim();
  if (!raw) return undefined;

  // Common fixes
  const up = raw.toUpperCase();

  // Already 2-letter code
  if (/^[A-Z]{2}$/.test(up)) return up;

  // 3-letter to 2-letter small map
  const A3_TO_A2: Record<string, string> = {
    BEL: "BE", ISR: "IL", FRA: "FR", USA: "US", GBR: "GB", UK: "GB",
    NLD: "NL", DEU: "DE", ESP: "ES", ITA: "IT", CHE: "CH"
  };

  if (A3_TO_A2[up]) return A3_TO_A2[up];

  // Names to codes small map (extend as needed)
  const NAME_TO_A2: Record<string, string> = {
    BELGIUM: "BE",
    ISRAEL: "IL",
    FRANCE: "FR",
    "UNITED KINGDOM": "GB",
    UK: "GB",
    "UNITED STATES": "US",
    USA: "US",
    NETHERLANDS: "NL",
    GERMANY: "DE",
    SPAIN: "ES",
    ITALY: "IT",
    SWITZERLAND: "CH"
  };

  const nameKey = up.replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (NAME_TO_A2[nameKey]) return NAME_TO_A2[nameKey];

  return undefined;
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }

  const csv = await file.text();
  const rows = parseTripsCsv(csv) as Array<Record<string, unknown>>;

  // Accept both our preferred headers and the legacy Excel export headers
  const COUNTRY_KEYS = ["countryCode", "country_code", "LOCATION", "location", "Country", "country"];
  const FROM_KEYS = ["dateFrom", "date_from", "from", "FROM", "start", "startDate", "Start Date"];
  const TO_KEYS = ["dateTo", "date_to", "to", "TO", "end", "endDate", "End Date"];
  const NOTES_KEYS = ["notes", "NOTES", "comment", "Comment", "Comments"];

  type Normalized = { country_code: string; date_from: Date; date_to: Date; notes?: string | null };

  const normalized: Normalized[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  rows.forEach((row, idx) => {
    const countryRaw = firstVal(row, COUNTRY_KEYS);
    const fromRaw = firstVal(row, FROM_KEYS);
    const toRaw = firstVal(row, TO_KEYS);
    const notesRaw = firstVal(row, NOTES_KEYS);

    const country = normalizeCountry(countryRaw);
    const date_from = parseDateLike(fromRaw);
    const date_to = parseDateLike(toRaw);

    if (!country || country.length !== 2) {
      errors.push({ row: idx + 1, message: "country code missing/invalid (expect 2-letter ISO, e.g. IL, BE)" });
      return;
    }
    if (!date_from) {
      errors.push({ row: idx + 1, message: "dateFrom missing/invalid (use YYYY-MM-DD)" });
      return;
    }
    if (!date_to) {
      errors.push({ row: idx + 1, message: "dateTo missing/invalid (use YYYY-MM-DD)" });
      return;
    }
    if (date_from.getTime() > date_to.getTime()) {
      errors.push({ row: idx + 1, message: "dateFrom is after dateTo" });
      return;
    }

    normalized.push({
      country_code: country,
      date_from,
      date_to,
      notes: notesRaw ? String(notesRaw).trim() : null
    });
  });

  // Ensure referenced countries exist to satisfy FK (idempotent upsert)
  const uniqueCodes = Array.from(new Set(normalized.map(n => n.country_code)));
  if (uniqueCodes.length > 0) {
    await prisma.$transaction(
      uniqueCodes.map(code =>
        prisma.country.upsert({
          where: { code },
          update: {},
          create: { code, label: code } // label can be refined later
        })
      )
    );
  }

  if (errors.length) {
    return NextResponse.json({ error: "Invalid CSV", errors }, { status: 400 });
  }

  // Insert within a transaction; keep per-row creates to respect RLS per row and surface exact failures
  await prisma.$transaction(
    normalized.map((n) =>
      prisma.trip.create({
        data: {
          user_id: userId,
          country_code: n.country_code,
          date_from: n.date_from,
          date_to: n.date_to,
          notes: n.notes ?? undefined
        }
      })
    )
  );

  return NextResponse.redirect(new URL("/trips", req.url));
}
