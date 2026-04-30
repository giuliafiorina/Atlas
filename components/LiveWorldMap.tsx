"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AtlasJournal, TravelCategory } from "@/data/journals";

type LiveWorldMapProps = {
  journals: AtlasJournal[];
};

export type JournalMapPin = {
  id: string;
  title: string;
  authorName: string;
  locationName: string;
  category: TravelCategory;
  photoUrl: string | null;
  teaser: string;
  createdAt: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  lat: string;
  lon: string;
};

const AtlasLeafletMap = dynamic(() => import("@/components/AtlasLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[28rem] items-center justify-center bg-[#D9C9B7]">
      <p className="font-serif text-3xl font-semibold text-ink">Loading the map...</p>
    </div>
  )
});

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeLocation(location: string) {
  const cacheKey = location.trim().toLowerCase();

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) ?? null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", location);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    geocodeCache.set(cacheKey, null);
    return null;
  }

  const results = (await response.json()) as NominatimResult[];
  const firstResult = results[0];

  if (!firstResult) {
    geocodeCache.set(cacheKey, null);
    return null;
  }

  const coordinates = {
    lat: Number(firstResult.lat),
    lng: Number(firstResult.lon)
  };

  geocodeCache.set(cacheKey, coordinates);
  return coordinates;
}

export function LiveWorldMap({ journals }: LiveWorldMapProps) {
  const journalsWithLocations = useMemo(
    () => journals.filter((journal) => journal.locationName.trim().length > 0),
    [journals]
  );
  const [pins, setPins] = useState<JournalMapPin[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const groupedLocations = journalsWithLocations.reduce<Record<string, AtlasJournal[]>>(
    (groups, journal) => {
      const key = journal.locationName.trim();
      groups[key] = [...(groups[key] ?? []), journal];
      return groups;
    },
    {}
  );
  const locationCount = Object.keys(groupedLocations).length;
  const topLocation = Object.entries(groupedLocations)
    .map(([location, locationJournals]) => ({
      location,
      journals: locationJournals
    }))
    .sort((a, b) => b.journals.length - a.journals.length)[0];

  useEffect(() => {
    let isMounted = true;

    async function resolvePins() {
      setIsGeocoding(true);

      const resolvedPins = await Promise.all(
        journalsWithLocations.map(async (journal) => {
          const coordinates = await geocodeLocation(journal.locationName);

          if (!coordinates) {
            return null;
          }

          return {
            id: journal.id,
            title: journal.title,
            authorName: journal.authorName,
            locationName: journal.locationName,
            category: journal.category,
            photoUrl: journal.photoUrl,
            teaser: journal.teaser,
            createdAt: journal.createdAt,
            lat: coordinates.lat,
            lng: coordinates.lng
          };
        })
      );

      if (!isMounted) {
        return;
      }

      setPins(resolvedPins.filter(Boolean) as JournalMapPin[]);
      setIsGeocoding(false);
    }

    resolvePins();

    return () => {
      isMounted = false;
    };
  }, [journalsWithLocations]);

  return (
    <section className="mb-20 overflow-hidden rounded-lg border border-ink/10 bg-bone shadow-[0_22px_70px_rgba(34,31,26,0.07)]">
      <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="flex flex-col justify-between border-b border-ink/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
              Live Atlas
            </p>
            <h2 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink sm:text-6xl">
              Stories are landing around the world.
            </h2>
            <p className="mt-5 text-base leading-7 text-ink/65">
              Every pin represents a real journal published by the Atlas community.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="border-t border-ink/10 pt-4">
              <p className="font-serif text-5xl font-semibold text-moss">
                {journalsWithLocations.length}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                Live stories
              </p>
            </div>
            <div className="border-t border-ink/10 pt-4">
              <p className="font-serif text-5xl font-semibold text-moss">
                {locationCount}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                Places mapped
              </p>
            </div>
          </div>

          {topLocation ? (
            <div className="mt-8 rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                Most active now
              </p>
              <p className="mt-2 font-serif text-3xl font-semibold text-ink">
                {topLocation.location}
              </p>
              <p className="mt-1 text-sm text-ink/60">
                {topLocation.journals.length} live{" "}
                {topLocation.journals.length === 1 ? "story" : "stories"}
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-ink/10 bg-paper p-4">
              <p className="font-serif text-3xl font-semibold text-ink">No pins yet</p>
              <p className="mt-1 text-sm text-ink/60">
                <Link href="/write" className="font-semibold text-moss hover:text-ink">
                  Write the first mapped journal.
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="relative min-h-[28rem] bg-[#D9C9B7]">
          <AtlasLeafletMap pins={pins} />
          {isGeocoding ? (
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-paper/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/60 shadow-soft">
              Finding locations
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
