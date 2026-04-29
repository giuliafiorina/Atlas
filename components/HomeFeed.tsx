"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { JournalCard } from "@/components/JournalCard";
import { categories, type AtlasJournal, type TravelCategory } from "@/data/journals";
import { mapJournalRow } from "@/lib/journal-mappers";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Link from "next/link";

type HomeFeedProps = {
  journals: AtlasJournal[];
};

export function HomeFeed({ journals }: HomeFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<TravelCategory | "All">("All");
  const [liveJournals, setLiveJournals] = useState(journals);
  const [isLoadingLiveFeed, setIsLoadingLiveFeed] = useState(journals.length === 0);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoadingLiveFeed(false);
      return;
    }

    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase
      .from("journals")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (!error && data) {
          setLiveJournals(data.map(mapJournalRow));
        }

        setIsLoadingLiveFeed(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") {
      return liveJournals;
    }

    return liveJournals.filter((post) => post.category === selectedCategory);
  }, [liveJournals, selectedCategory]);

  return (
    <section id="explore" className="border-y border-ink/10 bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
              Field notes
            </p>
            <h2 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink sm:text-6xl">
              Recent journals with a point of view.
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>

        {isLoadingLiveFeed ? (
          <div className="mt-12 rounded-lg border border-ink/10 bg-bone px-6 py-16 text-center">
            <p className="font-serif text-4xl font-semibold text-ink">
              Loading journals...
            </p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <JournalCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-lg border border-ink/10 bg-bone px-6 py-16 text-center">
            <p className="font-serif text-4xl font-semibold text-ink">
              No journals yet.
            </p>
            <p className="mt-3 text-lg text-ink/65">Be the first to write one.</p>
            <Link
              href="/write"
              className="mt-8 inline-flex rounded-full bg-moss px-6 py-4 text-sm font-semibold text-paper transition hover:bg-ink"
            >
              Start writing
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
