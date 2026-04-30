"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Globe, PenLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AtlasJournal } from "@/data/journals";
import type { JournalMapPin } from "@/components/LiveWorldMap";

type HeroProps = {
  journals: AtlasJournal[];
};

type NominatimResult = {
  lat: string;
  lon: string;
};

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeLocation(location: string) {
  const key = location.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", location);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) { geocodeCache.set(key, null); return null; }

  const results = (await res.json()) as NominatimResult[];
  const first = results[0];
  if (!first) { geocodeCache.set(key, null); return null; }

  const coords = { lat: Number(first.lat), lng: Number(first.lon) };
  geocodeCache.set(key, coords);
  return coords;
}

const AtlasLeafletMap = dynamic(() => import("@/components/AtlasLeafletMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#E8DFD0]" />
});

const categoryLegend = [
  { label: "Adventure", color: "#4CAF50" },
  { label: "Culture", color: "#EF4444" },
  { label: "Backpacking", color: "#F97316" },
  { label: "Luxury", color: "#A855F7" },
  { label: "Slow Travel", color: "#3B82F6" }
];

const communityAvatars = [
  { letter: "A", bg: "#244033" },
  { letter: "M", bg: "#B96E45" },
  { letter: "S", bg: "#527B81" },
  { letter: "L", bg: "#8B5364" }
];

export function Hero({ journals }: HeroProps) {
  const [pins, setPins] = useState<JournalMapPin[]>([]);

  // Only journals with a real location (not the "Somewhere" fallback)
  const journalsWithLocations = useMemo(
    () => journals.filter((j) => {
      const loc = j.locationName.trim();
      return loc.length > 0 && loc !== "Somewhere";
    }),
    [journals]
  );

  useEffect(() => {
    let isMounted = true;

    async function resolvePins() {
      for (const journal of journalsWithLocations) {
        if (!isMounted) return;

        // Prefer stored coordinates — skip Nominatim entirely when we have them
        if (journal.latitude !== null && journal.longitude !== null) {
          setPins((prev) => {
            if (prev.some((p) => p.id === journal.id)) return prev;
            return [...prev, {
              id: journal.id,
              title: journal.title,
              authorName: journal.authorName,
              locationName: journal.locationName,
              category: journal.category,
              photoUrl: journal.photoUrl,
              teaser: journal.teaser,
              createdAt: journal.createdAt,
              lat: journal.latitude as number,
              lng: journal.longitude as number
            }];
          });
          continue;
        }

        // Fall back to Nominatim geocoding for older journals without stored coords
        const cacheKey = journal.locationName.trim().toLowerCase();
        const wasCached = geocodeCache.has(cacheKey);
        const coords = await geocodeLocation(journal.locationName);

        if (!isMounted) return;

        if (!coords) {
          console.warn(`[Atlas map] Could not geocode "${journal.locationName}" — skipping pin.`);
          continue;
        }

        setPins((prev) => {
          if (prev.some((p) => p.id === journal.id)) return prev;
          return [...prev, {
            id: journal.id,
            title: journal.title,
            authorName: journal.authorName,
            locationName: journal.locationName,
            category: journal.category,
            photoUrl: journal.photoUrl,
            teaser: journal.teaser,
            createdAt: journal.createdAt,
            lat: coords.lat,
            lng: coords.lng
          }];
        });

        // Respect Nominatim's 1 req/sec limit — only delay fresh API calls
        if (!wasCached) {
          await new Promise((r) => setTimeout(r, 1100));
        }
      }
    }

    resolvePins().catch((err) => console.error("[Atlas map] pin resolution failed:", err));
    return () => { isMounted = false; };
  }, [journalsWithLocations]);

  return (
    <section id="map" className="relative w-full overflow-hidden" style={{ height: "620px" }}>
      {/* Live counter badge */}
      <div className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-ink/10 bg-paper/90 px-5 py-2 text-sm font-medium text-ink shadow-soft backdrop-blur-sm">
        <span
          className="h-2.5 w-2.5 rounded-full bg-green-500"
          style={{ boxShadow: "0 0 0 4px rgba(74,222,128,0.2)" }}
        />
        Live now &bull; {journals.length} stories from around the world
      </div>

      {/* Full-width map */}
      <div className="absolute inset-0 bg-[#E8DFD0]">
        <AtlasLeafletMap pins={pins} />
      </div>

      {/* Left text overlay — gradient fades map through */}
      <div
        className="absolute inset-y-0 left-0 z-10 flex flex-col justify-center px-10 py-16 lg:px-14"
        style={{
          width: "clamp(300px, 38%, 520px)",
          background: "linear-gradient(to right, rgba(245,239,224,0.96) 45%, rgba(245,239,224,0.82) 70%, transparent 100%)"
        }}
      >
        <h1
          className="font-serif font-bold leading-tight text-ink"
          style={{ fontSize: "clamp(2rem, 3.5vw, 3.25rem)" }}
        >
          The world is<br />yours to write.
        </h1>
        <p className="mt-4 max-w-xs text-base leading-relaxed text-ink/70">
          One place. One photo. One story.<br />
          Share your journey and inspire travelers around the world.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="#explore"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
          >
            <Globe aria-hidden="true" size={16} />
            Explore the map
          </Link>
          <Link
            href="/write"
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper/80 px-5 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition hover:border-moss hover:text-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
          >
            <PenLine aria-hidden="true" size={16} />
            Drop your story
          </Link>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {communityAvatars.map(({ letter, bg }) => (
              <div
                key={letter}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper text-xs font-bold text-paper"
                style={{ background: bg }}
                aria-hidden="true"
              >
                {letter}
              </div>
            ))}
          </div>
          <p className="text-sm text-ink/65">Join a community of travel storytellers.</p>
        </div>
      </div>

      {/* Category legend */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-5 rounded-full border border-ink/10 bg-paper/90 px-6 py-2.5 shadow-soft backdrop-blur-sm">
        {categoryLegend.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-medium text-ink">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
