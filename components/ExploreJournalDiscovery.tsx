"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bookmark, Heart, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";
import { JournalCard } from "@/components/JournalCard";
import {
  categories,
  categoryStyles,
  getReputationByName,
  stickerGlyphs,
  type AtlasJournal,
  type TravelCategory
} from "@/data/journals";
import { mapJournalRow } from "@/lib/journal-mappers";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type ExploreJournalDiscoveryProps = {
  initialJournals: AtlasJournal[];
};

type SortOption = "recent" | "loved" | "saved" | "longest";

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Most recent", value: "recent" },
  { label: "Most loved", value: "loved" },
  { label: "Most saved", value: "saved" },
  { label: "Longest read", value: "longest" }
];

const sortColumns: Record<SortOption, string> = {
  recent: "created_at",
  loved: "hearts",
  saved: "saves",
  longest: "read_time"
};

function normalizeSearchTerm(value: string) {
  return value.replace(/[%(),]/g, " ").replace(/\s+/g, " ").trim();
}

function compareByRecent(a: AtlasJournal, b: AtlasJournal) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function applyLocalFilters(
  journals: AtlasJournal[],
  selectedCategory: TravelCategory | "All",
  sortOption: SortOption,
  searchTerm: string
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return journals
    .filter((journal) => {
      const matchesCategory =
        selectedCategory === "All" || journal.category === selectedCategory;
      const matchesSearch =
        !normalizedSearch ||
        journal.title.toLowerCase().includes(normalizedSearch) ||
        journal.locationName.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === "loved") {
        return b.hearts - a.hearts || compareByRecent(a, b);
      }

      if (sortOption === "saved") {
        return b.saves - a.saves || compareByRecent(a, b);
      }

      if (sortOption === "longest") {
        return b.readTime - a.readTime || compareByRecent(a, b);
      }

      return compareByRecent(a, b);
    });
}

function getFeaturedJournal(journals: AtlasJournal[]) {
  return [...journals].sort((a, b) => b.hearts - a.hearts || compareByRecent(a, b))[0] ?? null;
}

function FeaturedJournalCard({ post }: { post: AtlasJournal | null }) {
  if (!post) {
    return (
      <article className="overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-soft">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[360px] bg-[#CFA06F] sm:min-h-[430px]">
            <div className="absolute inset-0 border-[18px] border-paper/12" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-paper">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-paper/75">
                Featured journal
              </p>
              <p className="mt-3 font-serif text-5xl font-semibold leading-none">
                Atlas awaits.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
              Most loved
            </p>
            <h2 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink">
              The first featured journal is waiting to be written.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink/68">
              Once travelers begin publishing, the most loved story will live here.
            </p>
            <Link
              href="/write"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-moss px-6 py-4 text-sm font-semibold text-paper transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 focus:ring-offset-paper"
            >
              Start writing
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  const rank = getReputationByName(post.authorRank);

  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-soft">
      <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[360px] overflow-hidden bg-[#CFA06F] sm:min-h-[430px]">
          {post.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.photoUrl}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[#CFA06F]" />
          )}
          <div className="absolute inset-0 border-[18px] border-paper/12" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-ink/35" />
          <div className="absolute left-6 top-6 flex gap-3">
            {post.stickers.map((sticker, index) => (
              <span
                key={sticker}
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full border border-paper/65 bg-paper/85 text-3xl shadow-[0_12px_28px_rgba(34,31,26,0.18)] backdrop-blur-sm ${
                  index === 1 ? "rotate-6" : "-rotate-6"
                }`}
                aria-label={sticker}
                role="img"
              >
                {stickerGlyphs[sticker]}
              </span>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-paper">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-paper/75">
              Most loved journal
            </p>
            <p className="mt-3 font-serif text-5xl font-semibold leading-none drop-shadow-sm sm:text-6xl">
              {post.locationName}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{post.authorName}</span>
            <span className="rounded-full bg-moss px-2.5 py-1 text-xs font-bold text-paper">
              L{rank.level} {rank.name}
            </span>
          </div>

          <h2 className="mt-5 font-serif text-5xl font-semibold leading-tight text-ink sm:text-6xl">
            {post.title}
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-bone px-3 py-1 text-xs font-semibold text-ink/62">
              <MapPin aria-hidden="true" size={14} />
              {post.locationName}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryStyles[post.category]}`}
            >
              {post.category}
            </span>
            <span className="rounded-full border border-ink/10 bg-bone px-3 py-1 text-xs font-semibold text-ink/55">
              {post.readTime} min read
            </span>
          </div>

          <p className="mt-6 text-lg leading-8 text-ink/70">{post.teaser}</p>

          <div className="mt-7 flex flex-wrap items-center gap-5 text-sm font-semibold text-ink/62">
            <span className="inline-flex items-center gap-1.5">
              <Heart aria-hidden="true" size={17} />
              {post.hearts.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bookmark aria-hidden="true" size={17} />
              {post.saves.toLocaleString()}
            </span>
          </div>

          <Link
            href={`/journals/${post.id}`}
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-moss px-6 py-4 text-sm font-semibold text-paper transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 focus:ring-offset-paper"
          >
            Read this journal →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ExploreJournalDiscovery({ initialJournals }: ExploreJournalDiscoveryProps) {
  const [selectedCategory, setSelectedCategory] = useState<TravelCategory | "All">("All");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [journals, setJournals] = useState(() =>
    applyLocalFilters(initialJournals, "All", "recent", "")
  );
  const [featuredJournal, setFeaturedJournal] = useState<AtlasJournal | null>(() =>
    getFeaturedJournal(initialJournals)
  );
  const [isLoading, setIsLoading] = useState(initialJournals.length === 0);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase
      .from("journals")
      .select("*")
      .order("hearts", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (!error && data?.[0]) {
          setFeaturedJournal(mapJournalRow(data[0]));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setJournals(applyLocalFilters(initialJournals, selectedCategory, sortOption, searchTerm));
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      const supabase = createSupabaseBrowserClient();
      const normalizedSearch = normalizeSearchTerm(searchTerm);
      let query = supabase.from("journals").select("*");

      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory);
      }

      if (normalizedSearch) {
        query = query.or(
          `title.ilike.%${normalizedSearch}%,location_name.ilike.%${normalizedSearch}%`
        );
      }

      query
        .order(sortColumns[sortOption], { ascending: false })
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!isCurrent) {
            return;
          }

          if (!error && data) {
            setJournals(data.map(mapJournalRow));
          } else {
            setJournals(
              applyLocalFilters(initialJournals, selectedCategory, sortOption, searchTerm)
            );
          }

          setIsLoading(false);
        });
    }, 180);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [initialJournals, searchTerm, selectedCategory, sortOption]);

  const journalCountLabel = useMemo(() => {
    const noun = journals.length === 1 ? "journal" : "journals";
    const categorySuffix = selectedCategory === "All" ? "" : ` in ${selectedCategory}`;

    return `${journals.length.toLocaleString()} ${noun}${categorySuffix}`;
  }, [journals.length, selectedCategory]);

  return (
    <section className="bg-bone">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">Explore</p>
          <h1 className="mt-4 font-serif text-6xl font-semibold leading-none text-ink sm:text-7xl lg:text-8xl">
            Find your next journey.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70 sm:text-xl">
            Browse journals from travelers who were actually there.
          </p>
        </div>

        <div className="mt-12">
          <FeaturedJournalCard post={featuredJournal} />
        </div>

        <div className="mt-12 rounded-lg border border-ink/10 bg-paper p-5 shadow-[0_18px_60px_rgba(34,31,26,0.06)] sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_220px_300px] xl:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">
                Category
              </p>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            <div>
              <label
                htmlFor="explore-sort"
                className="mb-3 block text-xs font-semibold uppercase tracking-[0.22em] text-ink/45"
              >
                Sort
              </label>
              <select
                id="explore-sort"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="h-12 w-full rounded-full border border-ink/15 bg-bone px-4 text-sm font-semibold text-ink/75 outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/20"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="explore-search"
                className="mb-3 block text-xs font-semibold uppercase tracking-[0.22em] text-ink/45"
              >
                Search
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38"
                />
                <input
                  id="explore-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Title or location"
                  className="h-12 w-full rounded-full border border-ink/15 bg-bone pl-11 pr-4 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/38 focus:border-moss focus:ring-2 focus:ring-moss/20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink/62">{journalCountLabel}</p>
          {isLoading ? (
            <p className="text-sm font-semibold text-moss">Updating journals...</p>
          ) : null}
        </div>

        {isLoading && journals.length === 0 ? (
          <div className="mt-6 rounded-lg border border-ink/10 bg-paper px-6 py-16 text-center">
            <p className="font-serif text-4xl font-semibold text-ink">Loading journals...</p>
          </div>
        ) : journals.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {journals.map((post) => (
              <JournalCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-ink/10 bg-paper px-6 py-16 text-center">
            <p className="font-serif text-4xl font-semibold text-ink">No journals found.</p>
            <p className="mt-3 text-lg text-ink/65">Try a different filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}
