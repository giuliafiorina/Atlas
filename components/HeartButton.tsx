"use client";

import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { pointsByAction } from "@/lib/reputation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { adjustUserPoints, ensureAtlasUser } from "@/lib/users";

type HeartButtonProps = {
  journalId: string;
  authorId: string;
  authorName: string;
  initialCount: number;
  /** "card" renders a compact pill overlay; "detail" renders a larger labelled button */
  variant?: "card" | "detail";
};

export function HeartButton({
  journalId,
  authorId,
  authorName,
  initialCount,
  variant = "detail"
}: HeartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [count, setCount] = useState(initialCount);
  const [isHearted, setIsHearted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;

    const supabase = createSupabaseBrowserClient();
    supabase
      .from("journal_hearts")
      .select("journal_id")
      .eq("journal_id", journalId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setIsHearted(true); });
  }, [journalId, user]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isSupabaseConfigured() || isUpdating) return;
    setIsUpdating(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await ensureAtlasUser(supabase, {
        id: user.id,
        fullName: user.fullName,
        firstName: user.firstName,
        email: user.primaryEmailAddress?.emailAddress,
        avatarUrl: user.imageUrl
      });

      if (isHearted) {
        await supabase
          .from("journal_hearts")
          .delete()
          .eq("journal_id", journalId)
          .eq("user_id", user.id);

        const { data } = await supabase.from("journals").select("hearts").eq("id", journalId).single();
        const next = Math.max(0, (data?.hearts ?? count) - 1);
        await supabase.from("journals").update({ hearts: next }).eq("id", journalId);
        await adjustUserPoints(supabase, authorId, -pointsByAction.receiveHeart, { full_name: authorName });
        if (user.id !== authorId) await adjustUserPoints(supabase, user.id, -pointsByAction.heartJournal);
        setCount(next);
        setIsHearted(false);
      } else {
        await supabase.from("journal_hearts").insert({ journal_id: journalId, user_id: user.id });
        const { data } = await supabase.from("journals").select("hearts").eq("id", journalId).single();
        const next = (data?.hearts ?? count) + 1;
        await supabase.from("journals").update({ hearts: next }).eq("id", journalId);
        await adjustUserPoints(supabase, authorId, pointsByAction.receiveHeart, { full_name: authorName });
        if (user.id !== authorId) await adjustUserPoints(supabase, user.id, pointsByAction.heartJournal);
        setCount(next);
        setIsHearted(true);
      }

      router.refresh();
    } finally {
      setIsUpdating(false);
    }
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isUpdating}
        aria-label={isHearted ? "Unlike" : "Like"}
        aria-pressed={isHearted}
        className={`relative z-10 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold backdrop-blur-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isHearted
            ? "bg-clay/90 text-white"
            : "bg-black/30 text-white hover:bg-clay/80"
        }`}
      >
        <Heart
          size={12}
          aria-hidden="true"
          className={isHearted ? "fill-current" : ""}
        />
        {count > 0 ? count : ""}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isUpdating}
      aria-label={isHearted ? "Unlike this journal" : "Like this journal"}
      aria-pressed={isHearted}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isHearted
          ? "border-clay bg-clay text-paper hover:bg-clay/90"
          : "border-ink/15 bg-paper text-ink hover:border-clay hover:text-clay"
      }`}
    >
      <Heart
        size={17}
        aria-hidden="true"
        className={isHearted ? "fill-current" : ""}
      />
      {isHearted ? "Liked" : "Like"} · {count.toLocaleString()}
    </button>
  );
}
