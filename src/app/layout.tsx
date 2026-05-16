import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "⚽ CloudMarc World Cup 2026",
  description: "CloudMarc internal World Cup 2026 tipping competition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="cm-pitch-bg min-h-full flex flex-col text-foreground">
        {/* Football-pattern body wash + brand radial gradients. The pattern
            is a tiled hex panel SVG (see /public/pitch-pattern.svg) at very
            low opacity so text stays readable. Hero-level imagery lives
            inside pages where it can sit behind specific content. */}
        <div className="relative z-10 flex flex-col min-h-full">
          <Nav />
          <main className="container mx-auto px-4 py-8 max-w-6xl flex-1">
            {children}
          </main>
          <footer className="text-center py-4 text-xs text-slate-600 border-t" style={{ borderColor: "rgba(193,15,255,0.1)" }}>
            ⚽ CloudMarc World Cup 2026 · Built with ❤️ for the team
          </footer>
        </div>
      </body>
    </html>
  );
}
