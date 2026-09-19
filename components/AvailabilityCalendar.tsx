"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dateKey, parseDateKey } from "@/lib/availability";
import { useInquiryDates } from "./InquiryDatesContext";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const SWIPE_MIN_PX = 48;

interface AvailabilityCalendarProps {
  /** YYYY-MM-DD keys. Plain strings so they can cross the server/client boundary. */
  blockedDates: string[];
  /** rangeStart is also treated as "today" so server and client agree on it. */
  rangeStart: string;
  rangeEnd: string;
}

type MonthStatus = "open" | "some" | "full";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function monthIndex(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "left" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"} />
    </svg>
  );
}

export default function AvailabilityCalendar({
  blockedDates: blockedKeys,
  rangeStart,
  rangeEnd,
}: AvailabilityCalendarProps) {
  const blocked = useMemo(() => new Set(blockedKeys), [blockedKeys]);
  const today = useMemo(() => parseDateKey(rangeStart), [rangeStart]);
  const lastDay = useMemo(() => parseDateKey(rangeEnd), [rangeEnd]);
  const firstMonth = useMemo(() => startOfMonth(today), [today]);
  const lastMonth = useMemo(() => startOfMonth(lastDay), [lastDay]);

  const [visibleMonth, setVisibleMonth] = useState(firstMonth);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const { sendDates } = useInquiryDates();

  // Range selection. Dates are inclusive: an event on Oct 2-4 occupies all
  // three days, so every day in between must be open.
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [bookedInfo, setBookedInfo] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** The first booked day after the start; the range can't reach it or go past it. */
  const limit = useMemo(() => {
    if (!start) return null;
    let first: string | null = null;
    for (const key of blocked) {
      if (key > start && (first === null || key < first)) first = key;
    }
    return first;
  }, [blocked, start]);

  function clearSelection() {
    setStart(null);
    setEnd(null);
    setHover(null);
    setBookedInfo(null);
    setNotice(null);
  }

  function formatShort(key: string) {
    return parseDateKey(key).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function selectDate(key: string) {
    setBookedInfo(null);
    setNotice(null);

    // Clicking the start again is the "undo a misclick" gesture.
    if (key === start) return clearSelection();

    // No start yet, a finished range, or an earlier date: begin a new selection.
    if (!start || end || key < start) {
      setStart(key);
      setEnd(null);
      setHover(null);
      return;
    }

    if (limit && key >= limit) {
      setNotice(
        `${formatShort(limit)} is already booked, so dates starting ${formatShort(start)} can't extend past ${formatShort(
          addDays(limit, -1)
        )}.`
      );
      return;
    }
    setEnd(key);
    setHover(null);
  }

  function addDays(key: string, n: number) {
    const d = parseDateKey(key);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }

  /** Far end of the highlighted span: the locked end, or the hovered preview. */
  const previewEnd = end ?? (start && hover && hover > start && (!limit || hover < limit) ? hover : null);
  const isPreview = !end && previewEnd !== null;

  const months = useMemo(() => {
    const list: Date[] = [];
    for (let m = firstMonth; m <= lastMonth; m = addMonths(m, 1)) list.push(m);
    return list;
  }, [firstMonth, lastMonth]);

  /** Open/booked counts for a month, only counting days from today onward. */
  const summarize = useMemo(() => {
    return (month: Date) => {
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      let open = 0;
      let booked = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(month.getFullYear(), month.getMonth(), d);
        if (date < today || date > lastDay) continue;
        if (blocked.has(dateKey(date))) booked++;
        else open++;
      }
      const status: MonthStatus = open === 0 && booked > 0 ? "full" : booked === 0 ? "open" : "some";
      return { open, booked, status };
    };
  }, [blocked, today, lastDay]);

  const summary = useMemo(() => summarize(visibleMonth), [summarize, visibleMonth]);

  const canGoPrev = monthIndex(visibleMonth) > monthIndex(firstMonth);
  const canGoNext = monthIndex(visibleMonth) < monthIndex(lastMonth);

  function goToMonth(target: Date) {
    const diff = monthIndex(target) - monthIndex(visibleMonth);
    if (diff === 0) return;
    setDirection(diff > 0 ? "next" : "prev");
    setVisibleMonth(target);
    setBookedInfo(null);
  }

  // Swipe between months on touch screens; vertical scrolling is left alone.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && canGoNext) goToMonth(addMonths(visibleMonth, 1));
    if (dx > 0 && canGoPrev) goToMonth(addMonths(visibleMonth, -1));
  }

  // Keep the active month chip in view without scrolling the page itself.
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!strip || !chip) return;
    strip.scrollTo({
      left: chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2,
      behavior: "smooth",
    });
  }, [visibleMonth]);

  const weeks = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = Array.from({ length: new Date(year, month, 1).getDay() }, () => null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const longDate = (key: string) =>
    parseDateKey(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const shortDate = (key: string) =>
    parseDateKey(key).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const dayCount =
    start && end ? Math.round((parseDateKey(end).getTime() - parseDateKey(start).getTime()) / 86_400_000) + 1 : 0;

  const navButton =
    "flex h-11 w-11 items-center justify-center rounded-full border border-walnut/15 bg-white/70 text-walnut-light transition hover:border-terracotta/60 hover:text-terracotta active:scale-95 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="overflow-hidden rounded-3xl border border-walnut/10 bg-white/70 shadow-[0_10px_40px_-18px_rgba(58,47,34,0.35)]">
      {/* Header */}
      <div className="px-3 pb-3 pt-4 sm:px-8 sm:pt-7">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className={navButton}
            onClick={() => goToMonth(addMonths(visibleMonth, -1))}
            disabled={!canGoPrev}
            aria-label="Previous month"
          >
            <ChevronIcon dir="left" />
          </button>
          <div className="text-center">
            <h3
              key={monthLabel}
              aria-live="polite"
              className="cal-pop font-display text-xl font-semibold text-walnut sm:text-2xl"
            >
              {monthLabel}
            </h3>
            <p className="mt-1 flex min-h-6 items-center justify-center text-sm text-walnut-light">
              {summary.status === "full" ? (
                <span key={`f-${monthLabel}`} className="cal-pop rounded-full bg-terracotta/10 px-3 py-0.5 text-xs font-medium text-terracotta">
                  Fully booked
                </span>
              ) : summary.status === "open" ? (
                <span key={`o-${monthLabel}`} className="cal-pop rounded-full bg-sage/15 px-3 py-0.5 text-xs font-medium text-walnut">
                  Wide open &middot; {summary.open} days available
                </span>
              ) : (
                <span key={`s-${monthLabel}`} className="cal-pop">
                  {summary.open} open &middot; {summary.booked} booked
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            className={navButton}
            onClick={() => goToMonth(addMonths(visibleMonth, 1))}
            disabled={!canGoNext}
            aria-label="Next month"
          >
            <ChevronIcon dir="right" />
          </button>
        </div>

        {/* Month strip: quick jumps without tapping through every month */}
        <div
          ref={stripRef}
          className="no-scrollbar relative -mx-3 mt-4 flex gap-2 overflow-x-auto px-3 pb-1 sm:-mx-8 sm:px-8"
          role="list"
          aria-label="Jump to month"
        >
          {months.map((m) => {
            const active = monthIndex(m) === monthIndex(visibleMonth);
            const { status } = summarize(m);
            const label = m.toLocaleDateString("en-US", { month: "short" });
            const showYear = m.getMonth() === 0 || m === months[0];
            return (
              <button
                key={monthIndex(m)}
                type="button"
                role="listitem"
                aria-current={active ? "true" : undefined}
                onClick={() => goToMonth(m)}
                className={[
                  "flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition active:scale-95",
                  active
                    ? "border-walnut bg-walnut text-cream"
                    : "border-walnut/15 bg-white/60 text-walnut-light hover:border-terracotta/50 hover:text-terracotta",
                ].join(" ")}
              >
                {label}
                {showYear && (
                  <span className="text-xs opacity-60">&rsquo;{String(m.getFullYear()).slice(2)}</span>
                )}
                <span
                  aria-hidden
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    status === "full" ? "bg-terracotta" : status === "some" ? "bg-gold" : "bg-sage",
                  ].join(" ")}
                />
                <span className="sr-only">
                  {status === "full" ? ", fully booked" : status === "some" ? ", some dates booked" : ", wide open"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div
        className="overflow-hidden px-2 pb-2 sm:px-8"
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="mb-1 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-0.5 text-center text-[11px] font-medium uppercase tracking-widest text-walnut-light/60 sm:gap-1.5">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} className="py-1.5">
              {label}
            </div>
          ))}
        </div>

        <div
          key={monthLabel}
          className={`grid grid-cols-[repeat(7,minmax(0,1fr))] gap-0.5 sm:gap-1.5 ${direction === "next" ? "cal-slide-next" : "cal-slide-prev"}`}
          role="grid"
          aria-label={monthLabel}
          onPointerLeave={() => setHover(null)}
        >
          {weeks.flatMap((week, wi) =>
            week.map((date, di) => {
              if (!date) return <div key={`${wi}-${di}`} className="aspect-square sm:aspect-[5/4]" />;

              const key = dateKey(date);
              const isPast = date < today;
              const isBlocked = blocked.has(key);
              const isToday = date.getTime() === today.getTime();
              const isStart = start === key;
              const isEnd = end === key;
              const isSelected = isStart || isEnd;
              const inSpan = !!start && !!previewEnd && key >= start && key <= previewEnd;
              const nextKey = di < 6 ? addDays(key, 1) : null;
              const joinsNext = inSpan && !!nextKey && !!previewEnd && !!start && nextKey <= previewEnd;
              const unreachable = !!start && !end && !isBlocked && !!limit && key > limit;
              const beyondRange = date > lastDay;
              const longLabel = date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              });

              const base =
                "relative flex aspect-square items-center sm:aspect-[5/4] justify-center rounded-xl text-[15px] transition duration-200 sm:text-base";

              if (isPast || beyondRange) {
                return (
                  <div key={key} className={`${base} text-walnut-light/25`} aria-label={`${longLabel}, unavailable`}>
                    {date.getDate()}
                  </div>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => (isBlocked ? (setBookedInfo(key), setNotice(null)) : selectDate(key))}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse" && !isBlocked) setHover(key);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${longLabel}, ${isBlocked ? "booked" : "available"}`}
                  className={[
                    base,
                    "font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                    isBlocked
                      ? "cal-booked-hatch bg-terracotta/10 text-terracotta/80 hover:bg-terracotta/15"
                      : inSpan
                        ? `${isPreview ? "bg-sage/25" : "bg-sage/40"} text-walnut hover:z-10`
                        : "bg-sage/12 text-walnut hover:z-10 hover:scale-105 hover:bg-sage/30 hover:shadow-md active:scale-95",
                    unreachable ? "opacity-40" : "",
                    isToday ? "ring-2 ring-gold ring-offset-1 ring-offset-white" : "",
                    isSelected ? "z-10 ring-2 ring-walnut ring-offset-1 ring-offset-white" : "",
                    isPreview && hover === key && key === previewEnd ? "z-10 ring-2 ring-walnut/40 ring-offset-1 ring-offset-white" : "",
                    joinsNext
                      ? `after:absolute after:inset-y-0 after:-right-0.5 after:w-0.5 sm:after:-right-1.5 sm:after:w-1.5 ${
                          isPreview ? "after:bg-sage/25" : "after:bg-sage/40"
                        }`
                      : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                  {isToday && (
                    <span aria-hidden className="absolute bottom-1.5 h-1 w-1 rounded-full bg-gold" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selection card */}
      <div className="px-3 sm:px-8" aria-live="polite">
        {bookedInfo && !start && (
          <div
            key={bookedInfo}
            className="cal-pop mt-2 rounded-2xl border border-terracotta/25 bg-terracotta/5 p-4"
          >
            <p className="font-display text-lg font-semibold text-walnut">{longDate(bookedInfo)}</p>
            <p className="text-sm text-walnut-light">
              This date is already booked. Nearby dates may still be open.
            </p>
          </div>
        )}
        {start && (
          <div
            key={`${start}-${end ?? ""}`}
            className="cal-pop mt-2 flex flex-col gap-3 rounded-2xl border border-sage/40 bg-sage/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-lg font-semibold text-walnut">
                {end ? `${shortDate(start)} – ${shortDate(end)}` : longDate(start)}
              </p>
              <p className={`text-sm ${notice || bookedInfo ? "text-terracotta" : "text-walnut-light"}`}>
                {notice ??
                  (bookedInfo
                    ? `${formatShort(bookedInfo)} is already booked.`
                    : end
                      ? `${dayCount} days, all open. Send an inquiry and we'll confirm them personally.`
                      : "Select your end date.")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              {!end && (
                <a
                  href="#inquiry"
                  onClick={() => sendDates(start, "")}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-walnut/30 px-5 text-sm font-medium text-walnut transition hover:border-walnut hover:bg-walnut/5 active:scale-95"
                >
                  Just this day
                </a>
              )}
              {end && (
                <a
                  href="#inquiry"
                  onClick={() => sendDates(start, end)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-terracotta px-6 text-sm font-medium text-cream transition hover:bg-terracotta-light active:scale-95"
                >
                  Send an Inquiry
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 pb-5 pt-4 text-xs text-walnut-light sm:px-8">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-3.5 w-3.5 rounded-md bg-sage/25 ring-1 ring-sage/40" /> Available
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="cal-booked-hatch h-3.5 w-3.5 rounded-md bg-terracotta/10 ring-1 ring-terracotta/40" /> Booked
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-3.5 w-3.5 rounded-md ring-2 ring-gold" /> Today
        </span>
        <button
          type="button"
          onClick={clearSelection}
          aria-disabled={!start}
          className={`font-medium underline-offset-4 transition ${
            start ? "text-terracotta hover:underline" : "cursor-default text-walnut-light/40"
          }`}
        >
          Clear dates
        </button>
      </div>
      <p className="pb-4 text-center text-xs text-walnut-light/60 sm:hidden">
        Swipe left or right to change month
      </p>
    </div>
  );
}
