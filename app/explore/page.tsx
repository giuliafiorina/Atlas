import { ExploreJournalDiscovery } from "@/components/ExploreJournalDiscovery";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getJournals } from "@/lib/journals";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const journals = await getJournals();

  return (
    <main>
      <SiteHeader />
      <ExploreJournalDiscovery initialJournals={journals} />
      <Footer />
    </main>
  );
}
