import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas | The world is yours to write",
  description:
    "Atlas is a travel journal community for people who write the world with intention."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#244033",
              colorText: "#221F1A",
              colorBackground: "#FFFDF8",
              colorInputBackground: "#FFFDF8",
              colorInputText: "#221F1A",
              borderRadius: "0.5rem",
              fontFamily: "ui-sans-serif, system-ui, sans-serif"
            },
            elements: {
              cardBox: "shadow-none",
              card: "border border-ink/10 shadow-none",
              headerTitle: "font-serif text-3xl text-ink",
              headerSubtitle: "text-ink/60",
              formButtonPrimary: "bg-moss hover:bg-ink",
              footerActionLink: "text-moss hover:text-ink"
            }
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
