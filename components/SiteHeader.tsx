"use client";

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { Bell, Menu, PenLine, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureAtlasUser } from "@/lib/users";

const navLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Map", href: "/#map" }
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const displayName =
    user?.firstName ?? user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Traveler";

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    ensureAtlasUser(supabase, {
      id: user.id,
      fullName: user.fullName,
      firstName: user.firstName,
      email: user.primaryEmailAddress?.emailAddress,
      avatarUrl: user.imageUrl
    }).catch((error) => {
      console.error("Failed to ensure Atlas user", error);
    });
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-bone/95 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10"
        aria-label="Primary navigation"
      >
        <Link href="/" className="font-serif text-3xl font-semibold tracking-normal text-ink">
          Atlas
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-ink/70 transition hover:text-moss"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition hover:border-moss hover:text-moss"
          >
            <Bell aria-hidden="true" size={16} />
          </button>
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-ink/70 transition hover:text-moss"
            >
              Sign In
            </Link>
            <Link
              href="/sign-in?redirect_url=/write"
              className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 focus:ring-offset-bone"
            >
              <PenLine aria-hidden="true" size={16} />
              Start Writing
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/profile"
              className="text-sm font-semibold text-ink/70 transition hover:text-moss"
            >
              Profile
            </Link>
            <Link
              href="/write"
              className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 focus:ring-offset-bone"
            >
              <PenLine aria-hidden="true" size={16} />
              Start Writing
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="max-w-28 truncate text-sm font-semibold text-ink/70 transition hover:text-moss"
              >
                {displayName}
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-ink/10 bg-paper px-5 py-5 shadow-soft md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-base font-medium text-ink/75"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-base font-medium text-ink/75"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/sign-in?redirect_url=/write"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-paper"
                onClick={() => setIsOpen(false)}
              >
                <PenLine aria-hidden="true" size={16} />
                Start Writing
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/profile"
                className="text-base font-medium text-ink/75"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/write"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-paper"
                onClick={() => setIsOpen(false)}
              >
                <PenLine aria-hidden="true" size={16} />
                Start Writing
              </Link>
              <div className="flex items-center justify-between border-t border-ink/10 pt-4">
                <span className="text-sm font-semibold text-ink/70">{displayName}</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      ) : null}
    </header>
  );
}
