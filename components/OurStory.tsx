export default function OurStory() {
  return (
    <section id="our-story" className="bg-cream px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-terracotta">
            Our Heritage
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-walnut sm:text-4xl">
            The Story of Rolls Ranch
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-walnut-light">
            Every great love story deserves a foundation built on honor,
            resilience, and family. Rolls Ranch is not just a wedding venue; it
            is the physical realization of a lifelong dream, named in loving
            memory of a true American hero: Franklin Lee Rolls.
          </p>
        </div>

        <details className="group mt-8">
          <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-walnut/30 px-8 py-3 font-medium text-walnut transition hover:border-walnut hover:bg-walnut/5 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Read Our Story</span>
            <span className="hidden group-open:inline">Show Less</span>
            <span
              aria-hidden
              className="transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>

          <div className="mt-10 space-y-6 text-lg leading-relaxed text-walnut-light">
            <h3 className="text-center font-display text-2xl font-semibold text-walnut">
              A Legacy Born from Deep Roots and High Horizons
            </h3>

            <h4 className="pt-4 font-display text-xl font-semibold text-walnut">
              The Bombardier from Oklahoma
            </h4>
            <p>
              Growing up on a farm in Oklahoma alongside his three sisters,
              Franklin Lee Rolls learned the value of hard work early in life.
              His favorite childhood memories were spent on his grandfather&apos;s
              sprawling cattle ranch, a place where his love for the wide-open
              land first took root. He always dreamed of owning a ranch of his
              own.
            </p>
            <p>
              When duty called during World War II, Franklin served his country
              with quiet bravery as a U.S. Army Air Forces Bombardier. Like many
              of his generation, he rarely spoke of his wartime sacrifices.
              Instead, he carried himself with a steady strength, a deep
              humility, and a lifelong longing for the open, peaceful horizon of
              a ranch to call his own.
            </p>

            <h4 className="pt-4 font-display text-xl font-semibold text-walnut">
              Connecting the Pieces of the Past
            </h4>
            <p>
              For years, a large piece of the Rolls family history remained
              waiting to be discovered. Our founder spent twelve formative years
              at The Masonic Home and School of Texas orphanage, separated from
              the extended family.
            </p>
            <p>
              Decades later, a journey on Ancestry.com ignited a profound
              connection. Through digital archives, our founder reconnected with
              long-lost Oklahoma relatives and cousins&mdash;the very family who
              had inherited the original cattle ranch where Franklin spent his
              boyhood summers. This discovery proved that the &ldquo;ranch&rdquo;
              was not just a passing dream; it truly ran deep in the Rolls family
              bloodline.
            </p>

            <h4 className="pt-4 font-display text-xl font-semibold text-walnut">
              Welcome to Rolls Ranch
            </h4>
            <p>
              In 2018, this pristine piece of property was purchased to finally
              anchor that generational dream. When it came time to name the
              land, there was only one choice: Rolls Ranch.
            </p>
            <p>
              Today, we open our gates to couples who are ready to build their
              own legacies. Whether you exchange vows on our tranquil Island
              Area or celebrate your reception under the wide-open skies of the
              Back40, you are standing on land built on resilience, rediscovered
              family, and enduring love.
            </p>
            <p className="pt-2 text-center font-display text-xl italic text-walnut">
              We built this place to honor a father&apos;s dream. We invite you
              to make it the starting point for yours.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
