import { parse } from "csv-parse/sync";

export type CsvTrip = {
  FROM: string;
  TO: string;
  LOCATION: string;
  NOTES?: string;
};

export function parseTripsCsv(csv: string): CsvTrip[] {
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return rows;
}
