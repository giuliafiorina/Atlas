import { reputationLevels, type ReputationLevelName } from "@/data/journals";
import type { UserProfileRow } from "@/lib/supabase/types";

export const pointsByAction = {
  publishJournal: 50,
  receiveHeart: 10,
  receiveComment: 15,
  receiveSave: 20,
  heartJournal: 2,
  dailyLoginStreak: 5
} as const;

export function getReputationForPointsValue(points: number) {
  return reputationLevels.reduce((current, level) => {
    return points >= level.pointsNeeded ? level : current;
  }, reputationLevels[0]);
}

export function getNextReputationForPoints(points: number) {
  return reputationLevels.find((level) => points < level.pointsNeeded) ?? null;
}

export function getReputationProgress(points: number) {
  const current = getReputationForPointsValue(points);
  const next = getNextReputationForPoints(points);

  if (!next) {
    return {
      current,
      next,
      percent: 100,
      pointsToNext: 0
    };
  }

  const pointsInLevel = points - current.pointsNeeded;
  const levelSpan = next.pointsNeeded - current.pointsNeeded;

  return {
    current,
    next,
    percent: Math.max(0, Math.min(100, Math.round((pointsInLevel / levelSpan) * 100))),
    pointsToNext: next.pointsNeeded - points
  };
}

export function createDefaultUserProfile(user: {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}): UserProfileRow {
  return {
    id: user.id,
    created_at: new Date().toISOString(),
    full_name: user.fullName ?? user.firstName ?? user.email ?? "Atlas Traveler",
    email: user.email ?? null,
    avatar_url: user.avatarUrl ?? null,
    points: 0,
    level: 1,
    rank_name: "Wanderer"
  };
}

export function rankFieldsForPoints(points: number) {
  const rank = getReputationForPointsValue(points);

  return {
    level: rank.level,
    rank_name: rank.name as ReputationLevelName
  };
}
