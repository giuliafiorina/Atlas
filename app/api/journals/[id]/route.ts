import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  isSupabaseConfigured
} from "@/lib/supabase/server";

type JournalRouteContext = {
  params: {
    id: string;
  };
};

export async function DELETE(_request: Request, { params }: JournalRouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to delete journals." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const supabase = createSupabaseAdminClient() ?? createSupabaseServerClient();

  const { data: journal, error: selectError } = await supabase
    .from("journals")
    .select("id, author_id")
    .eq("id", params.id)
    .single();

  if (selectError || !journal) {
    return NextResponse.json({ error: "Journal not found." }, { status: 404 });
  }

  if (journal.author_id !== userId) {
    return NextResponse.json(
      { error: "Only the author can delete this journal." },
      { status: 403 }
    );
  }

  const { data: deleted, error: rpcError } = await supabase.rpc(
    "delete_journal_for_author",
    {
      journal_uuid: params.id,
      clerk_user_id: userId
    }
  );

  if (rpcError) {
    return NextResponse.json(
      {
        error:
          "Could not delete this journal. Run the latest supabase/schema.sql so the owner-delete function exists."
      },
      { status: 500 }
    );
  }

  if (!deleted) {
    return NextResponse.json(
      { error: "Only the author can delete this journal." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
