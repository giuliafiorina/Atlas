import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mapJournalRow, normalizeAuthorName } from "@/lib/journal-mappers";

export async function getJournals() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch journals", error);
    return [];
  }

  const mappedJournals = data.map(mapJournalRow);
  const authorIds = Array.from(new Set(mappedJournals.map((journal) => journal.authorId)));

  if (authorIds.length === 0) {
    return mappedJournals;
  }

  const { data: profiles } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", authorIds);
  const profileNames = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name])
  );

  return mappedJournals.map((journal) => ({
    ...journal,
    authorName: normalizeAuthorName(
      journal.authorName,
      profileNames.get(journal.authorId)
    )
  }));
}

export async function getJournalById(id: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("journals").select("*").eq("id", id).single();

  if (error || !data) {
    return null;
  }

  return mapJournalRow(data);
}
