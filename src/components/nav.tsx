import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export async function Nav() {
  const session = await auth();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const displayName = session?.user?.name || session?.user?.email?.split("@")[0] || "";

  return (
    <nav
      className="border-b sticky top-0 z-50 backdrop-blur-md"
      style={{ borderColor: "var(--cm-border)", background: "var(--cm-nav-bg)" }}
    >
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/cloudmarc-logo.png"
              alt="CloudMarc"
              width={120}
              height={32}
              className="object-contain"
              priority
            />
            <span className="font-bold text-sm hidden sm:block" style={{ color: "#ffcd57" }}>
              ⚽ WC26
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-5">
            <Link href="/tips" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tips
            </Link>
            <Link href="/predict" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Predict
            </Link>
            <Link href="/schedule" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Schedule
            </Link>
            <Link href="/bracket" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Bracket
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            {session?.user && (
              <Link href="/my-tips" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                My Tips
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="text-sm font-medium transition-colors" style={{ color: "#ffcd57" }}>
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hidden sm:block hover:text-foreground transition-colors"
                title="Account settings"
              >
                {displayName}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="outline" size="sm" type="submit"
                  className="border-purple-500/40 text-muted-foreground hover:bg-purple-900/30">
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/signin">
              <Button size="sm" className="text-white font-semibold"
                style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}>
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
