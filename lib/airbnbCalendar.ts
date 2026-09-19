import "server-only";
import ical, { type VEvent } from "node-ical";
import { dateKey, expandDateRange } from "./availability";

const FETCH_TIMEOUT_MS = 10_000;

/**
 * Fetches the Airbnb iCal feed and returns every blocked day as a
 * YYYY-MM-DD key. Read-only: this only ever issues a GET.
 */
export async function getAirbnbBlockedDates(): Promise<Set<string>> {
  const url = process.env.AIRBNB_ICAL_URL;
  if (!url) throw new Error("AIRBNB_ICAL_URL is not set");

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Airbnb iCal request failed with status ${res.status}`);
  }

  const events = ical.sync.parseICS(await res.text());
  const blocked = new Set<string>();

  for (const component of Object.values(events)) {
    if (!component || component.type !== "VEVENT") continue;
    const event: VEvent = component;
    if (!event.start || !event.end) continue;

    // Airbnb sends all-day events (VALUE=DATE) with an exclusive DTEND.
    // node-ical builds those as local-midnight Dates, so local getters give
    // back the original calendar date.
    const startKey = dateKey(event.start);
    const endKey = dateKey(event.end);
    const days = expandDateRange(startKey, endKey);
    if (days.length === 0) days.push(startKey);
    for (const day of days) blocked.add(day);
  }

  return blocked;
}
