import { auth, currentUser } from "@clerk/nextjs/server";
import { Footer } from "@/components/Footer";
import { JournalCard } from "@/components/JournalCard";
import { SiteHeader } from "@/components/SiteHeader";
import { getReputationProgress } from "@/lib/reputation";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ensureAtlasUser } from "@/lib/users";
import { mapJournalRow } from "@/lib/journal-mappers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile | Atlas"
};

export default async function ProfilePage() {
  await auth.protect();

  const clerkUser = await currentUser();

  if (!clerkUser || !isSupabaseConfigured()) {
    return (
      <main>
        <SiteHeader />
        <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 lg:px-10">
          <p className="font-serif text-5xl font-semibold text-ink">Profile unavailable.</p>
          <p className="mt-4 text-lg text-ink/65">
            Sign in and confirm Supabase is configured to view your Atlas profile.
          </p>
        </section>
      </main>
    );
  }

  const supabase = createSupabaseServerClient();
  const profile = await ensureAtlasUser(supabase, {
    id: clerkUser.id,
    fullName: clerkUser.fullName,
    firstName: clerkUser.firstName,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    avatarUrl: clerkUser.imageUrl
  });

  const { data: journalRows } = await supabase
    .from("journals")
    .select("*")
    .eq("author_id", clerkUser.id)
    .order("created_at", { ascending: false });

  const journals = (journalRows ?? []).map(mapJournalRow);
  const progress = getReputationProgress(profile.points);
  const totalHearts = journals.reduce((total, journal) => total + journal.hearts, 0);
  const totalSaves = journals.reduce((total, journal) => total + journal.saves, 0);
  const avatarUrl = clerkUser.imageUrl || profile.avatar_url;
  const displayName =
    clerkUser.fullName ??
    clerkUser.firstName ??
    clerkUser.primaryEmailAddress?.emailAddress ??
    profile.full_name ??
    "Atlas Traveler";

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
              Traveler profile
            </p>
            <div className="mt-7 flex items-center gap-5">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-24 w-24 rounded-full border border-ink/10 object-cover shadow-[0_14px_40px_rgba(34,31,26,0.12)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ink/10 bg-paper font-serif text-4xl font-semibold text-moss shadow-[0_14px_40px_rgba(34,31,26,0.08)]">
                  {displayName.slice(0, 1)}
                </div>
              )}
              <div>
                <h1 className="font-serif text-5xl font-semibold leading-none text-ink sm:text-6xl">
                  {displayName}
                </h1>
                <p className="mt-3 text-lg font-medium text-ink/60">
                  Level {profile.level} {profile.rank_name}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-paper p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">
                  Current rank
                </p>
                <p className="mt-2 font-serif text-6xl font-semibold leading-none text-ink">
                  L{profile.level} {profile.rank_name}
                </p>
              </div>
              <div className="rounded-full bg-[#EAC06C] px-5 py-3 text-lg font-bold text-ink">
                {profile.points.toLocaleString()} pts
              </div>
            </div>

            <div className="mt-8 h-5 overflow-hidden rounded-full bg-oatmeal shadow-inner">
              <div
                className="h-full rounded-full bg-[#E7A93C] transition-all duration-700 ease-out"
                style={{ width: `${progress.percent}%` }}
                aria-hidden="true"
              />
            </div>

            <p className="mt-4 text-base font-semibold text-ink/68">
              {progress.next
                ? `${progress.pointsToNext.toLocaleString()} points to ${progress.next.name}`
                : "Top rank reached"}
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-ink/10 bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
              Journals
            </p>
            <p className="mt-2 font-serif text-4xl font-semibold text-ink">
              {journals.length.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-ink/10 bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
              Hearts received
            </p>
            <p className="mt-2 font-serif text-4xl font-semibold text-ink">
              {totalHearts.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-ink/10 bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
              Saves received
            </p>
            <p className="mt-2 font-serif text-4xl font-semibold text-ink">
              {totalSaves.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-16 border-t border-ink/10 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
                Published journals
              </p>
              <h2 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink">
                Your Atlas shelf.
              </h2>
            </div>
          </div>

          {journals.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {journals.map((journal) => (
                <JournalCard key={journal.id} post={journal} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-ink/10 bg-paper px-6 py-16 text-center">
              <p className="font-serif text-4xl font-semibold text-ink">
                No journals published yet.
              </p>
              <p className="mt-3 text-lg text-ink/65">
                Your stories will appear here after you publish.
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
