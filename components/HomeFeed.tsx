"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Camera, MapPin, PenLine, Users } from "lucide-react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { DarkJournalCard } from "@/components/DarkJournalCard";
import { UserSidebar } from "@/components/UserSidebar";
import { categories, type AtlasJournal, type TravelCategory } from "@/data/journals";
import { mapJournalRow, normalizeAuthorName } from "@/lib/journal-mappers";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type HomeFeedProps = {
  journals: AtlasJournal[];
};

const valueStrip = [
  { icon: Camera, label: "One photo", sub: "Capture the moment." },
  { icon: PenLine, label: "One story", sub: "Share what matters." },
  { icon: MapPin, label: "Real place", sub: "Be where you write." },
  { icon: Users, label: "Real community", sub: "Connect worldwide." }
];

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
      .then(async ({ data, error }) => {
        if (!isMounted) return;

        if (!error && data) {
          const mappedJournals = data.map(mapJournalRow);
          const authorIds = Array.from(new Set(mappedJournals.map((j) => j.authorId)));

          if (authorIds.length > 0) {
            const { data: profiles } = await supabase
              .from("users")
              .select("id, full_name")
              .in("id", authorIds);
            const profileNames = new Map(
              (profiles ?? []).map((p) => [p.id, p.full_name])
            );
            setLiveJournals(
              mappedJournals.map((j) => ({
                ...j,
                authorName: normalizeAuthorName(j.authorName, profileNames.get(j.authorId))
              }))
            );
          } else {
            setLiveJournals(mappedJournals);
          }
        }

        setIsLoadingLiveFeed(false);
      });

    return () => { isMounted = false; };
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") return liveJournals;
    return liveJournals.filter((p) => p.category === selectedCategory);
  }, [liveJournals, selectedCategory]);

  return (
    <section id="explore" className="border-y border-ink/10 bg-paper py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:items-start xl:grid-cols-[1fr_320px]">

          {/* Left — story feed */}
          <div>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
                  Field notes
                </p>
                <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                  Latest from the community
                </h2>
              </div>
              <Link
                href="/explore"
                className="text-sm font-semibold text-moss transition hover:text-ink"
              >
                View all stories →
              </Link>
            </div>

            <div className="mb-6">
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            {isLoadingLiveFeed ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl bg-oatmeal"
                    style={{ aspectRatio: "4/5" }}
                  />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredPosts.map((post) => (
                  <DarkJournalCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-ink/10 bg-bone px-6 py-16 text-center">
                <p className="font-serif text-4xl font-semibold text-ink">No journals yet.</p>
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

          {/* Right — user sidebar */}
          <div className="lg:sticky lg:top-24">
            <UserSidebar />
          </div>
        </div>
      </div>

      {/* Value strip */}
      <div className="mt-16 border-t border-ink/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-ink/10 px-5 sm:grid-cols-4 sm:px-8 lg:px-10">
          {valueStrip.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-5 py-6 sm:px-8"
            >
              <Icon aria-hidden="true" size={20} className="flex-shrink-0 text-ink/40" />
              <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="text-xs text-ink/55">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
