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
      <body className="min-h-full flex flex-col text-foreground" style={{ background: "#07003a" }}>
        {/* Subtle grid/noise background texture */}
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(193,15,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(6,0,151,0.15) 0%, transparent 50%)",
          zIndex: 0
        }} />
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
