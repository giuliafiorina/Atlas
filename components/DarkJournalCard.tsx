"use client";

import { Bookmark, MapPin } from "lucide-react";
import Link from "next/link";
import { HeartButton } from "@/components/HeartButton";
import type { AtlasJournal } from "@/data/journals";

function timeAgo(dateStr: string): string {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 5) return "Just now";
  if (hours < 1) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

type DarkJournalCardProps = {
  post: AtlasJournal;
};

export function DarkJournalCard({ post }: DarkJournalCardProps) {
  const authorInitial = (post.authorName || "T").charAt(0).toUpperCase();
  const location = post.locationName !== "Somewhere" ? post.locationName : post.zoneName;

  return (
    <Link
      href={`/journals/${post.id}`}
      className="group relative block overflow-hidden rounded-xl bg-ink"
      style={{ aspectRatio: "4/5" }}
    >
      {/* Background photo */}
      {post.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.photoUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-moss to-ink" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

      {/* Top row: location + bookmark */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-4">
        <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/90">
          <MapPin aria-hidden="true" size={11} className="flex-shrink-0" />
          {location}
        </div>
        <button
          type="button"
          aria-label="Save story"
          className="relative z-10 text-white/60 transition hover:text-white"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <Bookmark size={17} />
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-serif text-xl font-semibold leading-tight text-white">
          {post.title}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-moss/80 text-xs font-bold text-white"
            >
              {authorInitial}
            </div>
            <div>
              <p className="text-xs font-semibold text-white/90">
                {post.authorName.split(" ")[0]}
              </p>
              <p className="text-[10px] text-white/50">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <HeartButton
            journalId={post.id}
            authorId={post.authorId}
            authorName={post.authorName}
            initialCount={post.hearts}
            variant="card"
          />
        </div>
      </div>
    </Link>
  );
}
