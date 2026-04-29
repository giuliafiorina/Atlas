import type { TravelCategory, TravelSticker } from "@/data/journals";

export type UserProfileRow = {
  id: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  points: number;
  level: number;
  rank_name: string;
};

export type JournalRow = {
  id: string;
  created_at: string;
  title: string;
  body: string;
  teaser: string | null;
  location_name: string | null;
  zone_name: string | null;
  category: TravelCategory | null;
  journey_mode: boolean;
  stickers: TravelSticker[] | null;
  photo_url: string | null;
  author_id: string | null;
  author_name: string | null;
  author_rank: string | null;
  hearts: number;
  comments_count: number;
  saves: number;
  read_time: number | null;
};

export type JournalInsert = {
  title: string;
  body: string;
  teaser?: string | null;
  location_name?: string | null;
  zone_name?: string | null;
  category?: TravelCategory | null;
  journey_mode?: boolean;
  stickers?: TravelSticker[];
  photo_url?: string | null;
  author_id?: string | null;
  author_name?: string | null;
  author_rank?: string | null;
  hearts?: number;
  comments_count?: number;
  saves?: number;
  read_time?: number | null;
};

export type JournalUpdate = Partial<JournalInsert>;

export type JournalHeartRow = {
  journal_id: string;
  user_id: string;
  created_at: string;
};

export type JournalSaveRow = {
  journal_id: string;
  user_id: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserProfileRow;
        Insert: Omit<UserProfileRow, "created_at"> & { created_at?: string };
        Update: Partial<Omit<UserProfileRow, "id" | "created_at">>;
        Relationships: [];
      };
      journals: {
        Row: JournalRow;
        Insert: JournalInsert;
        Update: JournalUpdate;
        Relationships: [];
      };
      journal_hearts: {
        Row: JournalHeartRow;
        Insert: Omit<JournalHeartRow, "created_at"> & { created_at?: string };
        Update: never;
        Relationships: [];
      };
      journal_saves: {
        Row: JournalSaveRow;
        Insert: Omit<JournalSaveRow, "created_at"> & { created_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
