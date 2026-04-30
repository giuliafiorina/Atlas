import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HomeFeed } from "@/components/HomeFeed";
import { SiteHeader } from "@/components/SiteHeader";
import { getJournals } from "@/lib/journals";

export const dynamic = "force-dynamic";

export default async function Home() {
  const journals = await getJournals();

  return (
    <main>
      <SiteHeader />
      <Hero journals={journals} />
      <HomeFeed journals={journals} />
      <Footer />
    </main>
  );
}
