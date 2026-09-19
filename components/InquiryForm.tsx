"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useInquiryDates } from "./InquiryDatesContext";

type SubmitState = "idle" | "submitting" | "success" | "error";

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

export default function InquiryForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const { dates } = useInquiryDates();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pre-fill from the availability calendar. The fields stay editable, and a
  // new send from the calendar overwrites whatever was typed.
  useEffect(() => {
    if (!dates) return;
    setStartDate(dates.start);
    setEndDate(dates.end);
  }, [dates]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!FORMSPREE_ENDPOINT) {
      setState("error");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setState("submitting");

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setState("success");
        form.reset();
        setStartDate("");
        setEndDate("");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <section id="inquiry" className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-sage/30 bg-sage/10 p-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-walnut">
            Thank you!
          </h2>
          <p className="mt-3 text-walnut-light">
            Your inquiry is on its way. We&apos;ll be in touch soon to talk
            through your date.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="inquiry" className="px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-10 text-center">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-terracotta">
            Let&apos;s Talk
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-walnut sm:text-4xl">
            Send an Inquiry
          </h2>
          <p className="mx-auto mt-4 max-w-md text-walnut-light">
            This isn&apos;t an instant booking — submit your details and
            we&apos;ll follow up personally to confirm availability and talk
            through your day.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-walnut">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="w-full rounded-lg border border-walnut/20 bg-white/70 px-4 py-2.5 text-walnut placeholder:text-walnut-light/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-walnut">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="w-full rounded-lg border border-walnut/20 bg-white/70 px-4 py-2.5 text-walnut placeholder:text-walnut-light/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-walnut">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-walnut/20 bg-white/70 px-4 py-2.5 text-walnut placeholder:text-walnut-light/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-walnut">
                Start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-walnut/20 bg-white/70 px-4 py-2.5 text-walnut focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-walnut">
                End date <span className="text-walnut-light/60">(optional)</span>
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-walnut/20 bg-white/70 px-4 py-2.5 text-walnut focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>

          <div>
            <label htmlFor="guestCount" className="mb-1 block text-sm font-medium text-walnut">
              Estimated guest count
            </label>
            <input
              id="guestCount"
              name="guestCount"
              type="number"
              min={1}
              className="w-full rounded-lg border border-walnut/20 bg-white/70 px-4 py-2.5 text-walnut placeholder:text-walnut-light/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-walnut">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="Tell us a bit about your event..."
              className="w-full rounded-lg border border-walnut/20 bg-white/70 px-4 py-2.5 text-walnut placeholder:text-walnut-light/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          {state === "error" && (
            <p className="rounded-lg bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
              {FORMSPREE_ENDPOINT
                ? "Something went wrong sending your inquiry. Please try again, or email us directly."
                : "The inquiry form isn't configured yet — set NEXT_PUBLIC_FORMSPREE_ENDPOINT."}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "submitting"}
            className="w-full rounded-full bg-terracotta px-8 py-3 font-medium text-cream transition hover:bg-terracotta-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "submitting" ? "Sending..." : "Send Inquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}
