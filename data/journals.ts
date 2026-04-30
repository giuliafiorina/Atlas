export type ReputationLevelName =
  | "Wanderer"
  | "Pathfinder"
  | "Scout"
  | "Roamer"
  | "Voyager"
  | "Cartographer"
  | "Correspondent"
  | "Expedition"
  | "Compass"
  | "Atlas";

export type ReputationLevel = {
  level: number;
  name: ReputationLevelName;
  pointsNeeded: number;
};

export type TravelCategory =
  | "Slow travel"
  | "Adventure"
  | "Cultural"
  | "Food"
  | "Backpacking"
  | "Luxury"
  | "Road trip";

export type TravelSticker =
  | "passport"
  | "camera"
  | "mountain"
  | "sunset"
  | "coffee"
  | "map pin"
  | "airplane"
  | "fire"
  | "wave"
  | "moon";

export type AtlasJournal = {
  id: string;
  title: string;
  body: string;
  teaser: string;
  locationName: string;
  zoneName: string;
  latitude: number | null;
  longitude: number | null;
  category: TravelCategory;
  journeyMode: boolean;
  stickers: TravelSticker[];
  photoUrl: string | null;
  authorId: string;
  authorName: string;
  authorRank: ReputationLevelName;
  hearts: number;
  commentsCount: number;
  saves: number;
  readTime: number;
  createdAt: string;
};

export const categories: TravelCategory[] = [
  "Slow travel",
  "Adventure",
  "Cultural",
  "Food",
  "Backpacking",
  "Luxury",
  "Road trip"
];

export const stickerOptions: TravelSticker[] = [
  "passport",
  "camera",
  "mountain",
  "sunset",
  "coffee",
  "map pin",
  "airplane",
  "fire",
  "wave",
  "moon"
];

export const categoryStyles: Record<TravelCategory, string> = {
  "Slow travel": "bg-[#ECE2C8] text-[#584923] border-[#D8C891]",
  Adventure: "bg-[#DDE6DC] text-[#244033] border-[#B9CBBE]",
  Cultural: "bg-[#E8D8CF] text-[#6F3C29] border-[#D5B9A9]",
  Food: "bg-[#F0DFC5] text-[#7A4D18] border-[#DABF8D]",
  Backpacking: "bg-[#DEE3D4] text-[#4A5429] border-[#C3CCB1]",
  Luxury: "bg-[#E5D9E0] text-[#643A4C] border-[#CBB1BF]",
  "Road trip": "bg-[#D7E4E6] text-[#31555B] border-[#B1CCD0]"
};

export const reputationLevels: ReputationLevel[] = [
  { level: 1, name: "Wanderer", pointsNeeded: 0 },
  { level: 2, name: "Pathfinder", pointsNeeded: 100 },
  { level: 3, name: "Scout", pointsNeeded: 250 },
  { level: 4, name: "Roamer", pointsNeeded: 500 },
  { level: 5, name: "Voyager", pointsNeeded: 900 },
  { level: 6, name: "Cartographer", pointsNeeded: 1500 },
  { level: 7, name: "Correspondent", pointsNeeded: 2500 },
  { level: 8, name: "Expedition", pointsNeeded: 4000 },
  { level: 9, name: "Compass", pointsNeeded: 6500 },
  { level: 10, name: "Atlas", pointsNeeded: 10000 }
];

export const stickerGlyphs: Record<TravelSticker, string> = {
  passport: "🛂",
  camera: "📷",
  mountain: "⛰️",
  sunset: "🌅",
  coffee: "☕",
  "map pin": "📍",
  airplane: "✈️",
  fire: "🔥",
  wave: "🌊",
  moon: "🌙"
};

export function isTravelCategory(value: string | null | undefined): value is TravelCategory {
  return categories.includes(value as TravelCategory);
}

export function isTravelSticker(value: string): value is TravelSticker {
  return stickerOptions.includes(value as TravelSticker);
}

export function getReputationForPoints(points: number) {
  return reputationLevels.reduce((current, level) => {
    return points >= level.pointsNeeded ? level : current;
  }, reputationLevels[0]);
}

export function getReputationByName(name: string | null | undefined) {
  return reputationLevels.find((level) => level.name === name) ?? reputationLevels[0];
}

export function getNextReputationLevel(points: number) {
  return reputationLevels.find((level) => points < level.pointsNeeded) ?? null;
}

export function getRankProgress(points: number) {
  const current = getReputationForPoints(points);
  const next = getNextReputationLevel(points);

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
    percent: Math.round((pointsInLevel / levelSpan) * 100),
    pointsToNext: next.pointsNeeded - points
  };
}
