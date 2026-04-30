import { ArrowRight, BookOpen, Compass } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:pb-28 lg:pt-28">
      <div className="map-border relative max-w-3xl border border-umber/20 bg-bone/55 px-6 py-10 sm:px-10">
        <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-umber/70">
          <Compass aria-hidden="true" size={15} />
          Field journal no. 01
        </p>
        <h1 className="font-serif text-8xl font-bold leading-[0.9] tracking-normal text-ink sm:text-9xl lg:text-[10.5rem]">
          Atlas
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-3xl italic leading-tight text-moss sm:text-4xl">
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

      <aside className="map-border relative min-h-[28rem] overflow-hidden border border-umber/20 bg-[#EADDC5] p-4 shadow-[0_24px_80px_rgba(34,31,26,0.08)]">
        <svg
          viewBox="0 0 760 520"
          role="img"
          aria-label="Vintage cartographic illustration with compass rose, mountains, route lines, and map grid"
          className="h-full min-h-[26rem] w-full"
        >
          <rect x="10" y="10" width="740" height="500" fill="#EFE3CC" stroke="#8A6040" strokeOpacity="0.32" />
          <rect x="28" y="28" width="704" height="464" fill="none" stroke="#244033" strokeOpacity="0.18" />
          <g stroke="#8A6040" strokeOpacity="0.12" strokeWidth="1">
            {Array.from({ length: 10 }).map((_, index) => (
              <line key={`v-${index}`} x1={72 + index * 66} y1="30" x2={72 + index * 66} y2="490" />
            ))}
            {Array.from({ length: 7 }).map((_, index) => (
              <line key={`h-${index}`} x1="30" y1={84 + index * 58} x2="730" y2={84 + index * 58} />
            ))}
          </g>
          <g fill="none" stroke="#7D7C4B" strokeOpacity="0.2" strokeWidth="1.2">
            <path d="M54 166c96-58 193-58 288 0s191 58 288 0" />
            <path d="M72 260c106-45 205-45 298 0s188 45 285 0" />
            <path d="M82 354c91-38 178-38 261 0s174 38 272 0" />
          </g>

          <g transform="translate(154 154)" stroke="#244033" strokeWidth="2" strokeOpacity="0.86">
            <circle r="62" fill="none" />
            <circle r="8" fill="#244033" fillOpacity="0.78" />
            <path d="M0-92 15-17 0-8 -15-17Z" fill="#244033" fillOpacity="0.74" />
            <path d="M0 92 15 17 0 8 -15 17Z" fill="#B96E45" fillOpacity="0.72" />
            <path d="M92 0 17 15 8 0 17-15Z" fill="#8A6040" fillOpacity="0.7" />
            <path d="M-92 0-17 15-8 0-17-15Z" fill="#8A6040" fillOpacity="0.7" />
            <line x1="0" y1="-112" x2="0" y2="112" strokeOpacity="0.34" />
            <line x1="-112" y1="0" x2="112" y2="0" strokeOpacity="0.34" />
            <text x="-7" y="-121" fill="#244033" stroke="none" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="20">N</text>
          </g>

          <g fill="#244033" fillOpacity="0.64" stroke="#244033" strokeOpacity="0.72">
            <path d="M430 308 486 206 542 308Z" />
            <path d="M494 308 548 226 612 308Z" fill="#4D6F5D" fillOpacity="0.56" />
            <path d="M394 342 445 264 500 342Z" fill="#8A6040" fillOpacity="0.48" />
            <path d="M486 206 502 235 472 235Z" fill="#F5EFE0" stroke="none" fillOpacity="0.82" />
            <path d="M548 226 566 254 532 254Z" fill="#F5EFE0" stroke="none" fillOpacity="0.78" />
          </g>

          <path
            d="M194 330 C264 276 326 404 398 350 S520 250 606 314"
            fill="none"
            stroke="#B96E45"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="2 16"
            opacity="0.72"
          />
          <g fill="#B96E45">
            <circle cx="194" cy="330" r="7" />
            <circle cx="606" cy="314" r="7" />
          </g>
          <path d="M610 314c18-22 43-32 76-29-24 20-47 32-76 29Z" fill="#7D7C4B" fillOpacity="0.42" />

          <g stroke="#8A6040" strokeOpacity="0.46" fill="none">
            <path d="M54 50h74M54 50v74M706 50h-74M706 50v74M54 470h74M54 470v-74M706 470h-74M706 470v-74" strokeWidth="3" />
            <path d="M68 64h42M68 64v42M692 64h-42M692 64v42M68 456h42M68 456v-42M692 456h-42M692 456v-42" strokeWidth="1.5" />
          </g>
          <text x="402" y="105" fill="#8A6040" fillOpacity="0.52" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="28" fontStyle="italic">
            routes, ridges & recollections
          </text>
        </svg>
      </aside>
    </section>
  );
}
