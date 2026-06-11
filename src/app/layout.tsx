import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { BugReportButton } from "@/components/bug-report-button";
import { auth } from "@/lib/auth";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "⚽ CloudMarc World Cup 2026",
  description: "CloudMarc internal World Cup 2026 tipping competition",
  other: {
    // Prevent ALL browser auto-translation (covers Chrome on Android/iOS,
    // Samsung Internet, Comet, and any browser that checks this meta tag)
    "google": "notranslate",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  return (
    <html
      lang="en"
      translate="no"
      className={`${inter.variable} h-full antialiased notranslate`}
      suppressHydrationWarning
    >
      <body className="cm-pitch-bg min-h-full flex flex-col text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="relative z-10 flex flex-col min-h-full">
            <Nav />
            <main className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl flex-1 pb-24 md:pb-8">
              {children}
            </main>
            <footer
              className="text-center py-4 text-xs border-t hidden md:block"
              style={{
                borderColor: "var(--cm-border-faint)",
                color: "var(--cm-muted)",
              }}
            >
              ⚽ CloudMarc World Cup 2026 · Built with ❤️ for the team
            </footer>
            <BugReportButton />
            <BottomTabBar isAdmin={isAdmin} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
