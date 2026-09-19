import { Suspense } from "react";
import { connection } from "next/server";
import { getMergedAvailability } from "@/lib/mergedAvailability";
import AvailabilityCalendar from "./AvailabilityCalendar";

function CalendarSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading availability"
      className="overflow-hidden rounded-3xl border border-walnut/10 bg-white/70 shadow-[0_10px_40px_-18px_rgba(58,47,34,0.35)]"
    >
      <div className="px-3 pb-3 pt-4 sm:px-8 sm:pt-7">
        <div className="flex items-center justify-between gap-2">
          <div className="cal-shimmer h-11 w-11 rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <div className="cal-shimmer h-6 w-40 rounded-md" />
            <div className="cal-shimmer h-5 w-28 rounded-full" />
          </div>
          <div className="cal-shimmer h-11 w-11 rounded-full" />
        </div>
        <div className="no-scrollbar -mx-3 mt-4 flex gap-2 overflow-hidden px-3 sm:-mx-8 sm:px-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cal-shimmer h-11 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
      <div className="px-2 pb-6 sm:px-8">
        <div className="mb-1 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-0.5 sm:gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-center py-2">
              <div className="cal-shimmer h-2.5 w-3 rounded-sm" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-0.5 sm:gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="cal-shimmer aspect-square rounded-xl sm:aspect-[5/4]"
              style={{ animationDelay: `${(i % 7) * 60 + Math.floor(i / 7) * 90}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Notice({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-start gap-4 rounded-2xl border border-gold/40 bg-gold/10 text-left",
        compact ? "mb-4 p-4" : "flex-col items-center p-8 text-center sm:p-10",
      ].join(" ")}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`shrink-0 text-gold ${compact ? "mt-0.5 h-5 w-5" : "h-10 w-10"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M3.5 10h17M8 3.5v3M16 3.5v3M9 15h6" />
      </svg>
      <div>
        <p className={`font-display font-semibold text-walnut ${compact ? "text-base" : "text-xl"}`}>
          {title}
        </p>
        <p className={`text-walnut-light ${compact ? "mt-0.5 text-sm" : "mx-auto mt-2 max-w-md"}`}>
          {children}{" "}
          <a href="#inquiry" className="font-medium text-terracotta underline-offset-4 hover:underline">
            Send an inquiry
          </a>
          .
        </p>
      </div>
    </div>
  );
}

const MONTHS_AHEAD = 12;

async function AvailabilityData() {
  // Availability must reflect the live calendars on every request, so opt out
  // of static prerendering; the surrounding Suspense keeps the rest of the
  // page streaming in the meantime.
  await connection();

  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setMonth(rangeEnd.getMonth() + MONTHS_AHEAD);

  const data = await getMergedAvailability(rangeStart, rangeEnd);
  const { airbnb, google } = data.sources;

  if (airbnb === "error" && google === "error") {
    return (
      <Notice title="We&apos;ll confirm your date by hand">
        Our live calendar is taking a moment to load.
      </Notice>
    );
  }

  return (
    <>
      {(airbnb === "error" || google === "error") && (
        <Notice compact title="Calendar may be incomplete">
          A few bookings didn&apos;t load just now, so some dates shown as open
          may not be. We&apos;ll confirm your date personally.
        </Notice>
      )}
      <AvailabilityCalendar
        blockedDates={data.blockedDates}
        rangeStart={data.rangeStart}
        rangeEnd={data.rangeEnd}
      />
    </>
  );
}

export default function Availability() {
  return (
    <section id="availability" className="bg-cream-dark/60 px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-terracotta">
            Check the Date
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-walnut sm:text-4xl">
            Availability
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-walnut-light">
            Synced directly from our booking calendar. Booked dates are shown
            below — everything else is open. This isn&apos;t instant
            booking; submit an inquiry below and we&apos;ll confirm your date
            personally.
          </p>
        </div>

        {/* Bleed the calendar into the section gutter on phones for wider cells. */}
        <div className="-mx-3 sm:mx-0">
          <Suspense fallback={<CalendarSkeleton />}>
            <AvailabilityData />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
