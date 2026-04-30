"use client";

import { useUser } from "@clerk/nextjs";
import { BookOpen, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getReputationProgress } from "@/lib/reputation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserProfileRow } from "@/lib/supabase/types";

type UserStats = {
  storiesCount: number;
  countriesCount: number;
  likesCount: number;
};

export function UserSidebar() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [stats, setStats] = useState<UserStats>({ storiesCount: 0, countriesCount: 0, likesCount: 0 });
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user || !isSupabaseConfigured()) {
      setIsFetching(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    async function fetchData() {
      const [profileResult, journalsResult] = await Promise.all([
        supabase.from("users").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("journals").select("zone_name, hearts").eq("author_id", user!.id)
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data);
      }

      if (journalsResult.data) {
        const rows = journalsResult.data;
        setStats({
          storiesCount: rows.length,
          countriesCount: new Set(rows.map((r) => r.zone_name).filter(Boolean)).size,
          likesCount: rows.reduce((sum, r) => sum + (r.hearts ?? 0), 0)
        });
      }

      setIsFetching(false);
    }

    fetchData();
  }, [user, isLoaded]);

  if (!isLoaded || isFetching) {
    return (
      <aside className="h-72 animate-pulse rounded-xl border border-ink/10 bg-paper" />
    );
  }

  if (!user) {
    return (
      <aside className="rounded-xl border border-ink/10 bg-paper p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bone text-2xl">
          🧭
        </div>
        <p className="font-serif text-xl font-semibold text-ink">Start your journey</p>
        <p className="mt-2 text-sm text-ink/60">
          Sign in to track your travel stories, earn XP, and climb the ranks.
        </p>
        <Link
          href="/sign-in"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
        >
          Sign in
        </Link>
      </aside>
    );
  }

  const points = profile?.points ?? 0;
  const progress = getReputationProgress(points);
  const nextXp = progress.next?.pointsNeeded ?? points;

  return (
    <aside className="rounded-xl border border-ink/10 bg-paper p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ink/40">
        Your Journey
      </p>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink/55">
            Level {progress.current.level}
          </p>
          <p className="font-serif text-3xl font-bold leading-tight text-ink">
            {progress.current.name}
          </p>
          <p className="mt-1 text-xs text-ink/45">
            {points.toLocaleString()} / {nextXp.toLocaleString()} XP
          </p>
        </div>
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-ink/15 bg-bone text-2xl">
          🧭
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-oatmeal">
          <div
            className="h-full rounded-full bg-moss transition-all duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
            aria-label={`${progress.percent}% to next level`}
          />
        </div>
        {progress.next && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-ink/50">
            <span className="text-ink/30">▶</span>
            Next level: {progress.next.name}
          </p>
        )}
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ink/40">
          Your Stats
        </p>
        <div className="mt-3 grid grid-cols-3 divide-x divide-ink/10">
          <div className="pr-3 text-center">
            <BookOpen aria-hidden="true" size={16} className="mx-auto mb-1 text-ink/35" />
            <p className="font-serif text-2xl font-bold text-ink">{stats.storiesCount}</p>
            <p className="mt-0.5 text-[10px] text-ink/45">Stories</p>
          </div>
          <div className="px-3 text-center">
            <MapPin aria-hidden="true" size={16} className="mx-auto mb-1 text-ink/35" />
            <p className="font-serif text-2xl font-bold text-ink">{stats.countriesCount}</p>
            <p className="mt-0.5 text-[10px] text-ink/45">Countries</p>
          </div>
          <div className="pl-3 text-center">
            <Heart aria-hidden="true" size={16} className="mx-auto mb-1 text-ink/35" />
            <p className="font-serif text-2xl font-bold text-ink">{stats.likesCount}</p>
            <p className="mt-0.5 text-[10px] text-ink/45">Likes</p>
          </div>
        </div>
      </div>

      <Link
        href="/profile"
        className="mt-6 flex w-full items-center justify-center rounded-lg border border-ink/15 bg-bone py-2.5 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
      >
        View your journey →
      </Link>
    </aside>
  );
}
