"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Bookmark, Heart, MessageCircle, MapPin } from "lucide-react";
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
};

export function JournalCard({ post }: JournalCardProps) {
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
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-ink/30" />
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
        <div className="absolute bottom-0 left-0 right-0 p-6 text-paper">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-paper/75">
            {post.zoneName}
          </p>
          <p className="mt-2 font-serif text-5xl font-semibold leading-none drop-shadow-sm">
            {post.locationName}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-paper/85">
            <MapPin aria-hidden="true" size={15} />
            {post.journeyMode ? "The journey was the destination" : "Atlas journal"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{post.authorName}</span>
          <span className="rounded-full bg-moss px-2.5 py-1 text-xs font-bold text-paper">
            L{rank.level} {rank.name}
          </span>
        </div>

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
