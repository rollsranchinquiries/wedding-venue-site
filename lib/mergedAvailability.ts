import "server-only";
import { dateKey } from "./availability";
import { getAirbnbBlockedDates } from "./airbnbCalendar";
import { getGoogleBlockedDates } from "./googleCalendar";

export interface MergedAvailability {
  /** YYYY-MM-DD keys blocked in Airbnb OR Google Calendar, sorted. */
  blockedDates: string[];
  rangeStart: string;
  rangeEnd: string;
  sources: { airbnb: "ok" | "error"; google: "ok" | "error" };
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; value: Promise<MergedAvailability> }>();

async function fetchSource(
  name: string,
  load: () => Promise<Set<string>>
): Promise<Set<string> | null> {
  try {
    return await load();
  } catch (error) {
    console.error(`Availability source "${name}" failed:`, error);
    return null;
  }
}

async function load(rangeStart: Date, rangeEnd: Date): Promise<MergedAvailability> {
  const [airbnb, google] = await Promise.all([
    fetchSource("airbnb", getAirbnbBlockedDates),
    fetchSource("google", () => getGoogleBlockedDates(rangeStart, rangeEnd)),
  ]);

  const startKey = dateKey(rangeStart);
  const endKey = dateKey(rangeEnd);
  const blocked = new Set<string>();
  for (const source of [airbnb, google]) {
    for (const key of source ?? []) {
      if (key >= startKey && key <= endKey) blocked.add(key);
    }
  }

  return {
    blockedDates: [...blocked].sort(),
    rangeStart: startKey,
    rangeEnd: endKey,
    sources: {
      airbnb: airbnb ? "ok" : "error",
      google: google ? "ok" : "error",
    },
  };
}

/**
 * Returns the union of dates blocked in the Airbnb iCal feed and the owner's
 * Google Calendar within [rangeStart, rangeEnd]. A failing source is logged
 * and reported in `sources` rather than thrown, so the other source's data
 * can still be shown. Results are cached briefly so page views don't hammer
 * Airbnb or Google; failures are not cached.
 */
export function getMergedAvailability(
  rangeStart: Date,
  rangeEnd: Date
): Promise<MergedAvailability> {
  const key = `${dateKey(rangeStart)}_${dateKey(rangeEnd)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = load(rangeStart, rangeEnd);
  cache.set(key, { at: Date.now(), value });
  value.then((v) => {
    if (v.sources.airbnb === "error" || v.sources.google === "error") {
      cache.delete(key);
    }
  });
  return value;
}
