import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export const metadata = {
  title: "Sign In | Atlas"
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bone px-5 py-12">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-serif text-5xl font-semibold text-ink">
            Atlas
          </Link>
          <p className="mt-3 font-serif text-2xl text-moss">
            The world is yours to write.
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-paper p-4 shadow-soft">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        </div>
      </section>
    </main>
  );
}
