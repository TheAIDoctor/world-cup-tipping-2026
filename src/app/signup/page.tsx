import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/");

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
              <span className="cm-text-gradient">Join the Competition</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--cm-muted)" }}>
              Create your CloudMarc WC26 account
            </p>
          </div>
        </div>

        <div className="border-t" style={{ borderColor: "var(--cm-border-faint)" }} />

        <SignupForm />

        <p className="text-center text-xs" style={{ color: "var(--cm-muted)" }}>
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: "#c10fff" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
