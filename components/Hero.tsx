import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-28 lg:pt-28">
      <div className="max-w-3xl">
        <h1 className="font-serif text-8xl font-semibold leading-[0.9] tracking-normal text-ink sm:text-9xl lg:text-[10rem]">
          Atlas
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-3xl leading-tight text-moss sm:text-4xl">
          The world is yours to write.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="#explore"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-moss px-6 py-4 text-sm font-semibold text-paper transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 focus:ring-offset-bone"
          >
            Start reading
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <Link
            href="/write"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-paper px-6 py-4 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 focus:ring-offset-bone"
          >
            <BookOpen aria-hidden="true" size={17} />
            Share your journey
          </Link>
        </div>
      </div>

      <aside className="self-end border-l border-ink/15 pl-6 lg:pl-10">
        <p className="max-w-md font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl">
          “The best travel writing asks what a place changed in you.”
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-ink/10 pt-6">
          <div>
            <p className="font-serif text-4xl font-semibold text-moss">1</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink/55">
              Photo per zone
            </p>
          </div>
          <div>
            <p className="font-serif text-4xl font-semibold text-moss">10</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink/55">
              XP levels
            </p>
          </div>
          <div>
            <p className="font-serif text-4xl font-semibold text-moss">7</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink/55">
              Travel styles
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
