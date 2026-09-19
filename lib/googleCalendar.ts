import "server-only";
import { google } from "googleapis";
import { expandDateRange } from "./availability";

let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null;

/**
 * Service account credentials are expected as the *entire* JSON key file
 * contents in GOOGLE_SERVICE_ACCOUNT_KEY. JSON.parse turns the literal \n
 * sequences in private_key into real newlines, so no other processing is
 * needed.
 */
function getAuth() {
  if (cachedAuth) return cachedAuth;

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");

  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(rawKey);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email or private_key"
    );
  }

  cachedAuth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    // Read-only scope: this app never writes to the calendar.
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  return cachedAuth;
}

/** "2026-10-04T00:00:00-05:00" -> { date: "2026-10-04", isMidnight: true } */
function splitDateTime(dateTime: string) {
  return {
    date: dateTime.slice(0, 10),
    isMidnight: /T00:00(:00)?(\.0+)?(Z|[+-]\d\d:\d\d)?$/.test(dateTime),
  };
}

function nextDay(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns blocked days (YYYY-MM-DD keys) from the owner's Google Calendar
 * between timeMin and timeMax. Only start/end/status fields are requested,
 * so event titles and descriptions never leave Google. Dates are read from
 * the strings Google returns (in the calendar's own timezone) rather than
 * converted through the server's timezone.
 */
export async function getGoogleBlockedDates(
  timeMin: Date,
  timeMax: Date
): Promise<Set<string>> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID is not set");

  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const blocked = new Set<string>();
  let pageToken: string | undefined;

  do {
    const res = await calendar.events.list(
      {
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        maxResults: 2500,
        pageToken,
        fields: "nextPageToken,items(status,transparency,start,end)",
      },
      { timeout: 10_000 }
    );

    for (const event of res.data.items ?? []) {
      if (event.status === "cancelled") continue;
      // Events the owner marked "free" don't block the venue.
      if (event.transparency === "transparent") continue;

      let startKey: string | undefined;
      let endKey: string | undefined;

      if (event.start?.date) {
        // All-day event: end.date is already exclusive.
        startKey = event.start.date;
        endKey = event.end?.date ?? nextDay(startKey);
      } else if (event.start?.dateTime) {
        const start = splitDateTime(event.start.dateTime);
        startKey = start.date;
        if (event.end?.dateTime) {
          const end = splitDateTime(event.end.dateTime);
          // A timed event ending exactly at midnight doesn't touch that day.
          endKey = end.isMidnight ? end.date : nextDay(end.date);
        }
      }
      if (!startKey) continue;

      const days = expandDateRange(startKey, endKey ?? nextDay(startKey));
      if (days.length === 0) days.push(startKey);
      for (const day of days) blocked.add(day);
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return blocked;
}
