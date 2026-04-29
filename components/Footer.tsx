import Link from "next/link";

const footerLinks = ["Explore", "Guidelines", "Trip Buddy Board", "Privacy"];

export function Footer() {
  return (
    <footer className="bg-ink px-5 py-12 text-paper sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="font-serif text-4xl font-semibold">
            Atlas
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-paper/65">
            The world is yours to write.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-paper/70">
          {footerLinks.map((link) => (
            <Link key={link} href="#" className="transition hover:text-paper">
              {link}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
