import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mapJournalRow } from "@/lib/journal-mappers";

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

  return data.map(mapJournalRow);
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
