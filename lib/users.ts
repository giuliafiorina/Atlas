import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDefaultUserProfile,
  rankFieldsForPoints
} from "@/lib/reputation";
import type { Database, UserProfileRow } from "@/lib/supabase/types";

export type AtlasUserIdentity = {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export async function ensureAtlasUser(
  supabase: SupabaseClient<Database>,
  identity: AtlasUserIdentity
) {
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("id", identity.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  const profile = existing ?? createDefaultUserProfile(identity);
  const nextProfile = {
    ...profile,
    full_name: identity.fullName ?? identity.firstName ?? identity.email ?? profile.full_name,
    email: identity.email ?? profile.email,
    avatar_url: identity.avatarUrl ?? profile.avatar_url
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(nextProfile, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function adjustUserPoints(
  supabase: SupabaseClient<Database>,
  userId: string,
  delta: number,
  fallback?: Partial<UserProfileRow>
) {
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  const baseProfile =
    existing ??
    createDefaultUserProfile({
      id: userId,
      fullName: fallback?.full_name,
      email: fallback?.email,
      avatarUrl: fallback?.avatar_url
    });
  const points = Math.max(0, baseProfile.points + delta);
  const rankFields = rankFieldsForPoints(points);

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        ...baseProfile,
        ...fallback,
        points,
        ...rankFields
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await supabase
    .from("journals")
    .update({ author_rank: data.rank_name })
    .eq("author_id", userId);

  return data;
}
