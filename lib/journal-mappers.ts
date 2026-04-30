import {
  getReputationByName,
  isTravelCategory,
  isTravelSticker,
  type AtlasJournal,
  type TravelSticker
} from "@/data/journals";
import type { JournalRow } from "@/lib/supabase/types";

export function calculateReadTime(body: string) {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function normalizeAuthorName(
  authorName: string | null | undefined,
  fallbackName?: string | null
) {
  const rawName = fallbackName || authorName || "Traveler";

  if (rawName === "Atlas Traveler") {
    return "Traveler";
  }

  if (rawName.includes("@")) {
    return rawName.split("@")[0] || "Traveler";
  }

  return rawName;
}

export function mapJournalRow(row: JournalRow): AtlasJournal {
  const category = isTravelCategory(row.category) ? row.category : "Slow travel";
  const stickers = (row.stickers ?? []).filter(isTravelSticker).slice(0, 2) as TravelSticker[];
  const rank = getReputationByName(row.author_rank);

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    teaser: row.teaser ?? row.body.slice(0, 140),
    locationName: row.location_name ?? "Somewhere",
    zoneName: row.zone_name ?? "Unmapped",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    category,
    journeyMode: row.journey_mode,
    stickers: stickers.length === 2 ? stickers : ["map pin", "camera"],
    photoUrl: row.photo_url,
    authorId: row.author_id ?? "placeholder-user",
    authorName: normalizeAuthorName(row.author_name),
    authorRank: rank.name,
    hearts: row.hearts,
    commentsCount: row.comments_count,
    saves: row.saves,
    readTime: row.read_time ?? calculateReadTime(row.body),
    createdAt: row.created_at
  };
}
