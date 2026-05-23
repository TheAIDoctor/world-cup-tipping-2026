import Image from "next/image";
import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Glow backdrop */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(193,15,255,0.14) 0%, rgba(6,0,151,0.08) 45%, transparent 70%)",
        }}
      />

      <div
        className="w-full max-w-sm rounded-2xl border p-8 space-y-6 cm-glow text-center"
        style={{
          background: "var(--cm-card-bg)",
          borderColor: "var(--cm-border)",
        }}
      >
        <Image
          src="/cloudmarc-logo.png"
          alt="CloudMarc"
          width={140}
          height={38}
          className="h-9 w-auto object-contain mx-auto"
          priority
        />

        {/* Animated envelope */}
        <div
          className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{
            background:
              "radial-gradient(circle, rgba(193,15,255,0.18) 0%, rgba(6,0,151,0.12) 80%)",
            border: "1px solid rgba(193,15,255,0.3)",
          }}
        >
          ✉️
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold tracking-tight">
            <span className="cm-text-gradient">Check your inbox</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--cm-muted)" }}>
            We&apos;ve sent you a magic link. Click it to sign in instantly — no
            password required.
          </p>
        </div>

        <div
          className="rounded-lg px-4 py-3 text-xs leading-relaxed border space-y-1"
          style={{
            background: "rgba(255,205,87,0.06)",
            borderColor: "rgba(255,205,87,0.2)",
            color: "rgb(203 213 225 / 0.75)",
          }}
        >
          <p>
            <span style={{ color: "#ffcd57" }}>⏱ The link expires in 24 hours.</span>
          </p>
          <p>
            Can&apos;t find the email? Check your spam folder or{" "}
            <Link
              href="/signin"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: "#c10fff" }}
            >
              try again
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
