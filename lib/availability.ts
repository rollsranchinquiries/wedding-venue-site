/** Local YYYY-MM-DD key, deliberately not UTC-based to match how a venue thinks about "days". */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD key into a local-midnight Date. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Every YYYY-MM-DD key from startKey up to, but not including, endKey.
 * Works purely on date strings (via UTC math) so results never depend on the
 * server's timezone. iCal and Google all-day events both use exclusive end
 * dates, so a checkout day is not itself blocked.
 */
export function expandDateRange(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  const cursor = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return keys;

  while (cursor < end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}
