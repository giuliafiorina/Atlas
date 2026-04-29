import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HomeFeed } from "@/components/HomeFeed";
import { SiteHeader } from "@/components/SiteHeader";
import { getJournals } from "@/lib/journals";

export const dynamic = "force-dynamic";

export default async function Home() {
  const journals = await getJournals();

  return (
    <main>
      <SiteHeader />
      <Hero />
      <HomeFeed journals={journals} />
      <section
        id="trip-buddy-board"
        className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-24"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
            Trip Buddy Board
          </p>
          <h2 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink">
            Find companions who travel at your pace.
          </h2>
        </div>
        <div className="border-l border-ink/15 pl-6 text-lg leading-8 text-ink/70 lg:pl-10">
          <p>
            A quieter way to meet travelers before the journey begins: shared
            pace, flexible routes, respectful budgets, and enough context to
            decide whether the road would feel better together.
          </p>
          {/* Future: connect trip proposals, matching preferences, and authenticated replies. */}
        </div>
      </section>
      <section
        id="start-writing"
        className="border-t border-ink/10 bg-bone px-5 py-20 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
            Reputation begins with care
          </p>
          <h2 className="mt-5 font-serif text-5xl font-semibold leading-tight text-ink sm:text-6xl">
            Write the journey the way you actually lived it.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink/70">
            Bring back the details: the conversation that shifted your route,
            the meal that made a city legible, the ordinary morning you still
            think about months later.
          </p>
          {/* Future: gate the journal editor behind Clerk and persist posts with Supabase. */}
        </div>
      </section>
      <Footer />
    </main>
  );
}
