# Security Review Report

## Executive Summary

I found one high-risk access-control issue and several medium-risk privacy and hardening gaps.

The highest-priority problem is that the site presents itself as an internal CloudMarc competition, but it currently allows unrestricted self-registration for any email address without verification or a domain allowlist. In a runtime check on June 3, 2026, `POST /api/auth/register` returned `200 OK` for an arbitrary external address.

I also confirmed that the public leaderboard exposes participant email addresses, the app is missing baseline browser hardening headers, and the auth/mutation endpoints do not have visible abuse controls or robust server-side validation.

## High Severity

### SEC-001: Unrestricted self-registration on an internal-facing app

- Rule ID: SEC-001
- Severity: High
- Location:
  - [src/app/signup/page.tsx](/Users/daniellessa/Projects/World Cup Tipping/src/app/signup/page.tsx:7)
  - [src/components/signup-form.tsx](/Users/daniellessa/Projects/World Cup Tipping/src/components/signup-form.tsx:15)
  - [src/app/api/auth/register/route.ts](/Users/daniellessa/Projects/World Cup Tipping/src/app/api/auth/register/route.ts:5)
- Evidence:
  - The signup page is public and renders `SignupForm` with no auth gate.
  - The client posts directly to `/api/auth/register`.
  - The register route creates a user for any submitted email/password pair:

```ts
const { name, email, password } = await req.json();
...
await prisma.user.create({
  data: {
    email,
    name: name || null,
    password: hashed,
  },
});
```

  - Runtime verification on June 3, 2026:

```text
POST /api/auth/register
HTTP/1.1 200 OK
{"ok":true}
```

- Impact:
  - Anyone who can reach the site can create an account and access user-only features.
  - Because the app describes itself as "CloudMarc internal", this is an authorization gap, not just a product choice.
  - It also makes the lower-priority abuse and privacy issues easier to exploit.
- Fix:
  - Disable public signup, or restrict it to an explicit allowlist or CloudMarc email domain.
  - Add email verification or admin/invite approval before activating accounts.
  - If the app is truly internal-only, put it behind SSO, VPN, or another upstream access control.
- Mitigation:
  - As an immediate stopgap, remove the public signup link and block `/api/auth/register` except for admins or invite tokens.
- False positive notes:
  - If this is intentionally public, downgrade the severity, but the code and copy strongly suggest it is not.

## Medium Severity

### SEC-002: Public leaderboard leaks participant email addresses

- Rule ID: SEC-002
- Severity: Medium
- Location:
  - [src/lib/scoring.ts](/Users/daniellessa/Projects/World Cup Tipping/src/lib/scoring.ts:22)
  - [src/app/leaderboard/page.tsx](/Users/daniellessa/Projects/World Cup Tipping/src/app/leaderboard/page.tsx:11)
- Evidence:
  - `getLeaderboard()` selects every user's `email`.
  - The public `/leaderboard` page renders that email when it differs from the display name:

```ts
email: true,
...
{player.email !== player.name && (
  <p className="text-xs text-muted-foreground truncate">{player.email}</p>
)}
```

  - Runtime verification on June 3, 2026 showed participant email addresses in the anonymous HTML response for `/leaderboard`.
- Impact:
  - Unauthenticated visitors can collect participant email addresses for phishing, spam, or internal staff enumeration.
  - This is especially risky if staff use personal mailboxes or if the site is internet-accessible.
- Fix:
  - Remove emails from the public leaderboard.
  - If emails are needed operationally, show them only to admins or to the authenticated user viewing their own record.
- Mitigation:
  - Replace emails with display names only, or mask them.
- False positive notes:
  - If the app is only reachable on a private network, exposure is narrower, but the page itself is still unauthenticated.

### SEC-003: Missing baseline security headers and clickjacking/XSS hardening

- Rule ID: SEC-003
- Severity: Medium
- Location:
  - [next.config.ts](/Users/daniellessa/Projects/World Cup Tipping/next.config.ts:3)
  - [src/app/layout.tsx](/Users/daniellessa/Projects/World Cup Tipping/src/app/layout.tsx:19)
- Evidence:
  - `next.config.ts` is effectively empty.
  - I found no app-level header policy for CSP, clickjacking protection, nosniff, referrer policy, or permissions policy.
  - Runtime `curl -I http://localhost:3001/` on June 3, 2026 returned `X-Powered-By: Next.js` and basic caching/content headers, but no visible:
    - `Content-Security-Policy`
    - `X-Frame-Options` or CSP `frame-ancestors`
    - `X-Content-Type-Options`
    - `Referrer-Policy`
    - `Permissions-Policy`
- Impact:
  - The app has weaker browser-side protection against clickjacking and content injection.
  - Missing CSP means any future XSS bug will be easier to exploit.
- Fix:
  - Add a baseline header policy in Next.js or at the edge:
    - CSP with at least `default-src 'self'`
    - `frame-ancestors 'none'` or equivalent framing policy
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - a restrictive `Permissions-Policy`
  - Disable `X-Powered-By` unless there is a specific need for it.
- Mitigation:
  - If your reverse proxy or CDN already injects these headers, verify them there and document that ownership.
- False positive notes:
  - This finding is based on app code and local runtime responses only. External infrastructure may add headers in production.

### SEC-004: No visible rate limiting or brute-force protection on auth flows

- Rule ID: SEC-004
- Severity: Medium
- Location:
  - [src/lib/auth.ts](/Users/daniellessa/Projects/World Cup Tipping/src/lib/auth.ts:14)
  - [src/app/api/auth/register/route.ts](/Users/daniellessa/Projects/World Cup Tipping/src/app/api/auth/register/route.ts:5)
- Evidence:
  - Credential login accepts repeated password attempts with no backoff, lockout, or limiter:

```ts
const user = await prisma.user.findUnique({
  where: { email: String(credentials.email) },
});
...
const valid = await bcrypt.compare(String(credentials.password), user.password);
if (!valid) return null;
```

  - Signup also accepts repeated account creation attempts and has no visible quota, rate limit, or CAPTCHA.
  - I found no `middleware.ts`, edge rate limiter, or route-level throttle implementation in the repo.
- Impact:
  - Password spraying and brute-force attempts can be automated against the login endpoint.
  - The open signup route can be abused for account flooding and database noise.
- Fix:
  - Add per-IP and per-account throttling to login and signup.
  - Consider progressive delay or temporary lockout on repeated failures.
  - Put edge rate limiting in front of all public auth endpoints.
- Mitigation:
  - If infrastructure already rate-limits these paths, verify it and make the policy explicit in deployment docs.
- False positive notes:
  - There may be network-level rate limiting outside the repo. I did not find evidence of it in app code.

### SEC-005: Mutation endpoints trust client input too much

- Rule ID: SEC-005
- Severity: Medium
- Location:
  - [src/app/api/tips/route.ts](/Users/daniellessa/Projects/World Cup Tipping/src/app/api/tips/route.ts:12)
  - [src/app/api/predictions/route.ts](/Users/daniellessa/Projects/World Cup Tipping/src/app/api/predictions/route.ts:14)
  - [src/app/api/user/profile/route.ts](/Users/daniellessa/Projects/World Cup Tipping/src/app/api/user/profile/route.ts:12)
- Evidence:
  - The server accepts JSON bodies and uses them with minimal validation.
  - `/api/tips` does not enforce numeric bounds, payload size, or batch size on the server before upserting.
  - `/api/predictions` spreads `tournament` and `topScorers` directly into Prisma upserts.
  - `/api/user/profile` accepts arbitrary `name` strings and only basic length checks for password changes.
- Impact:
  - Authenticated users can bypass client-side checks and submit impossible scores, invalid team selections, oversized batches, or malformed bodies.
  - This is primarily a data integrity and abuse-control problem, but it becomes easier to exploit because account creation is currently open.
- Fix:
  - Validate request bodies with a runtime schema library such as `zod`.
  - Enforce:
    - max batch size for tips
    - integer ranges for scores
    - valid match IDs and team choices
    - uniqueness rules for finalists
    - sane length limits for names and scorer fields
- Mitigation:
  - At minimum, reject non-integers, negative values, and oversized arrays server-side before touching the database.
- False positive notes:
  - If only trusted staff use the app, the risk is lower, but the API still accepts direct requests outside the UI.

## Dependency and Runtime Notes

### DEP-001: `npm audit` reports current package advisories

- Date checked: June 3, 2026
- Command: `npm audit --omit=dev --json`
- Summary:
  - Moderate: `next` via `postcss`
  - Moderate: `nodemailer`
  - Moderate: `qs`
  - Low: `next-auth`, `@auth/core`, `@auth/prisma-adapter`
- Important context:
  - The repo does not appear to use `nodemailer` directly in app code.
  - I did not find an app-level code path that feeds user CSS into PostCSS stringification.
  - `qs` appears transitive; reachability in this app is not obvious from the codebase alone.
- Recommended action:
  - Treat these as dependency hygiene work, not confirmed exploit paths in this repo.
  - Upgrade or remove unused dependencies where possible, then re-run `npm audit`.

## Other Notes

- Production build succeeded with `npm run build`.
- `npm run lint` did not run successfully in this checkout because the local `eslint` executable failed with `Cannot find module '../package.json'`. That prevented a full lint-based pass, but it did not block the code and runtime review.

