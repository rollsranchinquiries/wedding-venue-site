# Rolls Ranch — Marketing Site

A single-page marketing site for a ranch wedding/event venue: hero, photo
gallery, a read-only availability calendar merged from Airbnb and Google Calendar, and
an inquiry form. No accounts, no database, no payments — booking happens
off-site after a couple submits an inquiry.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS** — everything lives on
  one page (`app/page.tsx`); there are no other routes.
- **`yet-another-react-lightbox`** for the gallery's lightbox/carousel.
- **Google Calendar Free/Busy API** (via a server-only Route Handler) for
  availability — the site never writes to the calendar, and only ever asks
  for free/busy status, never event titles or guest details.
- **Formspree** for the inquiry form (no custom backend/email server).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuring the Availability calendar

The Availability section (`components/Availability.tsx`) is a server component
that merges two read-only sources through `lib/mergedAvailability.ts`: a date
is blocked if it appears in **either**. It streams in behind its own loading
skeleton, so the rest of the page never waits on it. If one source fails it's
logged and the other is still shown (with a notice); if both fail, the section
shows an "availability temporarily unavailable" message. Results are cached
in memory for 5 minutes. Set these in `.env.local` locally, and in your host's
environment variables when you deploy:

- `AIRBNB_ICAL_URL` — the listing's exported iCal (.ics) link, fetched
  directly and parsed with `node-ical` (`lib/airbnbCalendar.ts`).
- `GOOGLE_CALENDAR_ID` — the owner's manual-blocking calendar. In Google
  Calendar, go to the calendar's **Settings and sharing** →
  **Integrate calendar** → **Calendar ID**.
- `GOOGLE_SERVICE_ACCOUNT_KEY` — the full contents of a Google Cloud service
  account JSON key, pasted as-is. In `.env.local` wrap it in single quotes so
  the multi-line JSON parses; the code `JSON.parse`s it directly.

Steps to create the service account:

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or
   reuse) a project and enable the **Google Calendar API**.
2. Create a service account, then create a JSON key for it and download it.
3. Set the file's contents as `GOOGLE_SERVICE_ACCOUNT_KEY`.
4. In Google Calendar, share the calendar with the service account's
   `client_email` using **"See all event details"**. Never grant "Make
   changes" — the app is strictly read-only (`calendar.readonly` scope).

`lib/googleCalendar.ts` lists events but requests only their start/end/status
fields, so titles and descriptions are never fetched. Events marked "free"
(transparent) and cancelled events don't block dates.

## Configuring the inquiry form

The inquiry form posts directly from the browser to
[Formspree](https://formspree.io) using `@formspree/react`, which also shows
per-field validation errors from Formspree:

1. Create a free Formspree account and a new form.
2. Set `NEXT_PUBLIC_FORMSPREE_FORM_ID` to the ID at the end of the form's
   endpoint (`https://formspree.io/f/abcdwxyz` → `abcdwxyz`).
3. In Formspree's dashboard, set the notification email to the venue
   owner's inbox.

No server code is needed for this — see `components/InquiryForm.tsx`.

## Photo gallery

`components/Gallery.tsx` currently points at placeholder SVGs in
`public/gallery/`. To swap in real photos:

1. Drop real photos into `public/gallery/` (or wherever you like).
2. Update the `GALLERY_IMAGES` array in `components/Gallery.tsx` with each
   photo's path and its **real pixel width/height** — this is what lets
   Next.js reserve layout space up front and avoid layout shift.
3. Once every image is a real JPG/PNG/WebP (not SVG), you can remove the
   `dangerouslyAllowSVG` block from `next.config.ts`.

Images use `next/image` with `loading="lazy"`, so only images near the
viewport are fetched as the user scrolls.

## Project structure

```
app/
  page.tsx                  single page: Hero, Gallery, Availability, InquiryForm
components/
  Hero.tsx
  Gallery.tsx
  Availability.tsx          server component: Suspense + merged data + error states
  AvailabilityCalendar.tsx  month-grid presentation
  InquiryForm.tsx
lib/
  mergedAvailability.ts     merges both sources, error handling, caching
  airbnbCalendar.ts         Airbnb iCal fetch + parse (node-ical)
  googleCalendar.ts         Google service-account auth + events.list
  availability.ts           shared date helpers
public/gallery/             placeholder images — replace with real photos
```

## Deploying

Any Next.js host works (Vercel, etc.). Set the three env vars above in the
host's environment settings — nothing else is required; there's no database
to provision.
