import { auth } from "@clerk/nextjs/server";
import { WriteJournalForm } from "@/components/WriteJournalForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Write | Atlas"
};

export default async function WritePage() {
  await auth.protect();

  return (
    <main>
      <SiteHeader />
      <WriteJournalForm />
    </main>
  );
}
