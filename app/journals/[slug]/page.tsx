import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { RankProgress } from "@/components/RankProgress";
import { SiteHeader } from "@/components/SiteHeader";
import { categoryStyles, getReputationByName, stickerGlyphs } from "@/data/journals";
import { getJournalById } from "@/lib/journals";

type JournalPageProps = {
  params: {
    slug: string;
  };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: JournalPageProps): Promise<Metadata> {
  const post = await getJournalById(params.slug);

  if (!post) {
    return {
      title: "Journal not found | Atlas"
    };
  }

  return {
    title: `${post.title} | Atlas`,
    description: post.teaser
  };
}

export default async function JournalPage({ params }: JournalPageProps) {
  const post = await getJournalById(params.slug);

  if (!post) {
    notFound();
  }

  const rank = getReputationByName(post.authorRank);

  return (
    <main>
      <SiteHeader />
      <article className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryStyles[post.category]}`}
          >
            {post.category}
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-ink/45">
            {post.readTime} min read
          </span>
        </div>

        <h1 className="mt-8 max-w-4xl font-serif text-6xl font-semibold leading-none text-ink sm:text-7xl">
          {post.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-base">
          <span className="font-semibold text-ink">{post.authorName}</span>
          <span className="rounded-full bg-moss px-2.5 py-1 text-xs font-bold text-paper">
            L{rank.level} {rank.name}
          </span>
        </div>

        <div className="relative mt-10 aspect-[16/10] overflow-hidden bg-[#CFA06F]">
          {post.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.photoUrl} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 border-[24px] border-paper/12" />
          <div className="absolute left-6 top-6 flex gap-3">
            {post.stickers.map((sticker, index) => (
              <span
                key={sticker}
                className={`inline-flex h-16 w-16 items-center justify-center rounded-full border border-paper/65 bg-paper/85 text-4xl shadow-[0_12px_28px_rgba(34,31,26,0.18)] backdrop-blur-sm ${
                  index === 1 ? "rotate-6" : "-rotate-6"
                }`}
                aria-label={sticker}
                role="img"
              >
                {stickerGlyphs[sticker]}
              </span>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-ink/30 p-8 text-paper">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-paper/75">
              {post.journeyMode ? "The journey was the destination" : post.locationName}
            </p>
            <p className="mt-3 font-serif text-6xl font-semibold leading-none">
              {post.zoneName}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div className="journal-body text-xl leading-9 text-ink/75">
            <p className="font-serif text-3xl leading-tight text-ink">{post.teaser}</p>
            <div dangerouslySetInnerHTML={{ __html: post.body }} />
          </div>

          <aside className="lg:sticky lg:top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-moss">
              Traveler profile
            </p>
            <RankProgress points={rank.pointsNeeded} />
          </aside>
        </div>
      </article>
      {/* Future: connect this live Atlas journal detail page to Clerk user profiles. */}
      <Footer />
    </main>
  );
}
