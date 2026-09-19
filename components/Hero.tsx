import Image from "next/image";
import heroImage from "@/assets/ranch_pond_sunset.jpg";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-walnut px-6 py-28 text-cream sm:px-10 sm:py-36">
      <Image
        src={heroImage}
        alt="Sunset over the pond at Rolls Ranch"
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-walnut/60" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-gold">
          Wedding &amp; Event Venue
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight sm:text-6xl">
          Rolls Ranch
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-cream/85 sm:text-xl">
          [Placeholder] Say &ldquo;I do&rdquo; under open sky, where century-old
          oaks meet a restored barn and rolling pasture stretches to the
          horizon. An intimate, all-in-one venue for ceremonies and
          receptions that feel like home.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#availability"
            className="rounded-full bg-terracotta px-8 py-3 font-medium text-cream transition hover:bg-terracotta-light"
          >
            Check Availability
          </a>
          <a
            href="#inquiry"
            className="rounded-full border border-cream/40 px-8 py-3 font-medium text-cream transition hover:border-cream hover:bg-cream/10"
          >
            Send an Inquiry
          </a>
        </div>
      </div>
    </section>
  );
}
