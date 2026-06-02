"use server";

import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface SignInPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string; registered?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  if (session?.user) redirect("/");

  const params = await searchParams;
  const error = params.error;
  const callbackUrl = params.callbackUrl ?? "/";
  const registered = params.registered === "1";

  const errorMessages: Record<string, string> = {
    CredentialsSignin: "Incorrect email or password. Please try again.",
    Default: "Something went wrong. Please try again.",
  };
  const errorMsg = error ? (errorMessages[error] ?? errorMessages.Default) : null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(193,15,255,0.14) 0%, rgba(6,0,151,0.08) 45%, transparent 70%)",
        }}
      />

      <div
        className="w-full max-w-sm rounded-2xl border p-8 space-y-6 cm-glow"
        style={{ background: "var(--cm-card-bg)", borderColor: "var(--cm-border)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/cloudmarc-logo.png"
            alt="CloudMarc"
            width={140}
            height={38}
            className="h-9 w-auto object-contain"
            priority
          />
          <div className="text-center">
            <h1 className="text-xl font-extrabold tracking-tight">
              <span className="cm-text-gradient">World Cup 2026</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--cm-muted)" }}>
              Sign in to submit tips &amp; predictions
            </p>
          </div>
        </div>

        <div className="border-t" style={{ borderColor: "var(--cm-border-faint)" }} />

        {registered && (
          <div
            className="text-sm text-center px-4 py-3 rounded-lg border"
            style={{
              background: "rgba(134,239,172,0.1)",
              borderColor: "rgba(134,239,172,0.35)",
              color: "rgb(134 239 172)",
            }}
          >
            Account created! Sign in below.
          </div>
        )}
        {errorMsg && (
          <div
            className="text-sm text-center px-4 py-3 rounded-lg border"
            style={{
              background: "rgba(239,68,68,0.1)",
              borderColor: "rgba(239,68,68,0.35)",
              color: "rgb(252 165 165)",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: callbackUrl,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--cm-muted)" }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@cloudmarc.com.au"
              className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2 ring-offset-0"
              style={{
                background: "var(--cm-card-deep, rgba(13,0,96,0.3))",
                borderColor: "var(--cm-border)",
                color: "var(--cm-foreground)",
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--cm-muted)" }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg px-4 py-3 text-sm font-medium border outline-none transition-all focus:ring-2 ring-offset-0"
              style={{
                background: "var(--cm-card-deep, rgba(13,0,96,0.3))",
                borderColor: "var(--cm-border)",
                color: "var(--cm-foreground)",
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #060097, #c10fff)" }}
          >
            Sign In →
          </button>
        </form>

        <p className="text-center text-xs leading-relaxed" style={{ color: "var(--cm-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: "#c10fff" }}
          >
            Create one
          </Link>
          {" · "}
          <span>Forgot your password? Ask an admin to reset it.</span>
        </p>
      </div>
    </div>
  );
}
