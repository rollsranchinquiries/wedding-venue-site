"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface InquiryDates {
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD, empty for a single-day inquiry */
  end: string;
  /** Changes on every send so the form re-fills even if the dates match a previous send. */
  nonce: number;
}

interface InquiryDatesValue {
  dates: InquiryDates | null;
  sendDates: (start: string, end: string) => void;
}

const InquiryDatesContext = createContext<InquiryDatesValue | null>(null);

/** Carries the range picked in the availability calendar over to the inquiry form. */
export function InquiryDatesProvider({ children }: { children: ReactNode }) {
  const [dates, setDates] = useState<InquiryDates | null>(null);

  const value = useMemo<InquiryDatesValue>(
    () => ({
      dates,
      sendDates: (start, end) => setDates({ start, end, nonce: Date.now() }),
    }),
    [dates]
  );

  return <InquiryDatesContext.Provider value={value}>{children}</InquiryDatesContext.Provider>;
}

export function useInquiryDates(): InquiryDatesValue {
  const ctx = useContext(InquiryDatesContext);
  if (!ctx) throw new Error("useInquiryDates must be used inside InquiryDatesProvider");
  return ctx;
}
