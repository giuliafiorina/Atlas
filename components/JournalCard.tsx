"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Bookmark, Heart, MessageCircle, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type AtlasJournal,
  categoryStyles,
  getReputationByName,
  stickerGlyphs
} from "@/data/journals";
import { pointsByAction } from "@/lib/reputation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { adjustUserPoints, ensureAtlasUser } from "@/lib/users";

type JournalCardProps = {
  post: AtlasJournal;
  onDeleted?: (journalId: string) => void;
};

export function JournalCard({ post, onDeleted }: JournalCardProps) {
  const rank = getReputationByName(post.authorRank);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [heartCount, setHeartCount] = useState(post.hearts);
  const [saveCount, setSaveCount] = useState(post.saves);
  const [isHearted, setIsHearted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUpdatingHeart, setIsUpdatingHeart] = useState(false);
  const [isUpdatingSave, setIsUpdatingSave] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const isAuthor = user?.id === post.authorId;
  const authorDisplayName = post.authorName.includes("@")
    ? post.authorName.split("@")[0]
    : post.authorName === "Atlas Traveler"
      ? "Traveler"
      : post.authorName;

  useEffect(() => {
    setHeartCount(post.hearts);
    setSaveCount(post.saves);
  }, [post.hearts, post.saves]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      setIsHearted(false);
      setIsSaved(false);
      return;
    }

    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    Promise.all([
      supabase
        .from("journal_hearts")
        .select("journal_id")
        .eq("journal_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("journal_saves")
        .select("journal_id")
        .eq("journal_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle()
    ]).then(([heartResult, saveResult]) => {
      if (!isMounted) {
        return;
      }

      if (!heartResult.error) {
        setIsHearted(Boolean(heartResult.data));
      }

      if (!saveResult.error) {
        setIsSaved(Boolean(saveResult.data));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [post.id, user]);

  function redirectToSignIn() {
    router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname)}`);
  }

  async function updateJournalCounter(field: "hearts" | "saves", delta: number) {
    const supabase = createSupabaseBrowserClient();

    if (field === "hearts") {
      const { data: currentJournal, error: selectError } = await supabase
        .from("journals")
        .select("hearts")
        .eq("id", post.id)
        .single();

      if (selectError) {
        throw selectError;
      }

      const nextValue = Math.max(0, currentJournal.hearts + delta);
      const { error: updateError } = await supabase
        .from("journals")
        .update({ hearts: nextValue })
        .eq("id", post.id);

      if (updateError) {
        throw updateError;
      }

      return nextValue;
    }

    const { data: currentJournal, error: selectError } = await supabase
      .from("journals")
      .select("saves")
      .eq("id", post.id)
      .single();

    if (selectError) {
      throw selectError;
    }

    const nextValue = Math.max(0, currentJournal.saves + delta);
    const { error: updateError } = await supabase
      .from("journals")
      .update({ saves: nextValue })
      .eq("id", post.id);

    if (updateError) {
      throw updateError;
    }

    return nextValue;
  }

  async function toggleHeart() {
    if (!user) {
      redirectToSignIn();
      return;
    }

    if (!isSupabaseConfigured() || isUpdatingHeart) {
      return;
    }

    setIsUpdatingHeart(true);

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
        const { error } = await supabase
          .from("journal_hearts")
          .delete()
          .eq("journal_id", post.id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        const nextCount = await updateJournalCounter("hearts", -1);
        await adjustUserPoints(supabase, post.authorId, -pointsByAction.receiveHeart, {
          full_name: post.authorName
        });

        if (user.id !== post.authorId) {
          await adjustUserPoints(supabase, user.id, -pointsByAction.heartJournal);
        }

        setHeartCount(nextCount);
        setIsHearted(false);
      } else {
        const { error } = await supabase.from("journal_hearts").insert({
          journal_id: post.id,
          user_id: user.id
        });

        if (error) {
          throw error;
        }

        const nextCount = await updateJournalCounter("hearts", 1);
        await adjustUserPoints(supabase, post.authorId, pointsByAction.receiveHeart, {
          full_name: post.authorName
        });

        if (user.id !== post.authorId) {
          await adjustUserPoints(supabase, user.id, pointsByAction.heartJournal);
        }

        setHeartCount(nextCount);
        setIsHearted(true);
      }

      router.refresh();
    } finally {
      setIsUpdatingHeart(false);
    }
  }

  async function toggleSave() {
    if (!user) {
      redirectToSignIn();
      return;
    }

    if (!isSupabaseConfigured() || isUpdatingSave) {
      return;
    }

    setIsUpdatingSave(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await ensureAtlasUser(supabase, {
        id: user.id,
        fullName: user.fullName,
        firstName: user.firstName,
        email: user.primaryEmailAddress?.emailAddress,
        avatarUrl: user.imageUrl
      });

      if (isSaved) {
        const { error } = await supabase
          .from("journal_saves")
          .delete()
          .eq("journal_id", post.id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        const nextCount = await updateJournalCounter("saves", -1);
        await adjustUserPoints(supabase, post.authorId, -pointsByAction.receiveSave, {
          full_name: post.authorName
        });
        setSaveCount(nextCount);
        setIsSaved(false);
      } else {
        const { error } = await supabase.from("journal_saves").insert({
          journal_id: post.id,
          user_id: user.id
        });

        if (error) {
          throw error;
        }

        const nextCount = await updateJournalCounter("saves", 1);
        await adjustUserPoints(supabase, post.authorId, pointsByAction.receiveSave, {
          full_name: post.authorName
        });
        setSaveCount(nextCount);
        setIsSaved(true);
      }

      router.refresh();
    } finally {
      setIsUpdatingSave(false);
    }
  }

  async function deleteJournal() {
    if (!user) {
      redirectToSignIn();
      return;
    }

    if (!isAuthor || isDeleting) {
      return;
    }

    const confirmed = window.confirm(`Delete "${post.title}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setDeleteError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/journals/${post.id}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not delete this journal.");
      }

      onDeleted?.(post.id);
      router.refresh();
    } catch (caughtError) {
      setDeleteError(
        caughtError instanceof Error ? caughtError.message : "Could not delete this journal."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-[0_18px_60px_rgba(34,31,26,0.08)] transition duration-300 hover:-translate-y-1 hover:border-moss/35 hover:shadow-soft">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#CFA06F]">
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
        <div className="absolute left-5 top-5 flex gap-3">
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
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="border-b border-ink/10 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
            {post.zoneName}
          </p>
          <p className="mt-2 font-serif text-4xl font-semibold leading-none text-ink">
            {post.locationName}
          </p>
          <p className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink/80">
            {post.title}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink/55">
            <MapPin aria-hidden="true" size={15} />
            {post.journeyMode ? "The journey was the destination" : "Atlas journal"}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{authorDisplayName}</span>
            <span className="rounded-full bg-moss px-2.5 py-1 text-xs font-bold text-paper">
              L{rank.level} {rank.name}
            </span>
          </div>
          {isAuthor ? (
            <button
              type="button"
              onClick={deleteJournal}
              disabled={isDeleting}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/55 transition hover:border-clay hover:bg-[#F4E3D8] hover:text-clay disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Delete ${post.title}`}
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          ) : null}
        </div>

        {deleteError ? (
          <p className="mt-3 rounded-lg bg-[#F4E3D8] px-3 py-2 text-xs font-semibold text-[#713B25]">
            {deleteError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryStyles[post.category]}`}
          >
            {post.category}
          </span>
          <span className="rounded-full border border-ink/10 bg-bone px-3 py-1 text-xs font-semibold text-ink/55">
            {post.readTime} min read
          </span>
        </div>

        <p className="mt-5 line-clamp-2 min-h-[3.5rem] text-base leading-7 text-ink/75">
          {post.teaser}
        </p>

        <Link
          href={`/journals/${post.id}`}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 focus:ring-offset-paper"
        >
          Read the full journal →
        </Link>

        <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 text-sm font-semibold text-ink/62">
          <button
            type="button"
            onClick={toggleHeart}
            disabled={isUpdatingHeart}
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-bone ${
              isHearted ? "text-clay" : "hover:text-clay"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-label={isHearted ? `Unheart ${post.title}` : `Heart ${post.title}`}
            aria-pressed={isHearted}
          >
            <Heart
              aria-hidden="true"
              size={17}
              className={isHearted ? "fill-current" : ""}
            />
            {heartCount.toLocaleString()}
          </button>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle aria-hidden="true" size={17} />
            {post.commentsCount.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={toggleSave}
            disabled={isUpdatingSave}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-bone hover:text-moss"
            aria-label={isSaved ? `Unsave ${post.title} journal` : `Save ${post.title} journal`}
            aria-pressed={isSaved}
          >
            <Bookmark
              aria-hidden="true"
              size={17}
              className={isSaved ? "fill-current text-moss" : ""}
            />
            {saveCount.toLocaleString()}
          </button>
        </div>
      </div>
    </article>
  );
}
