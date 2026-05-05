# Launch posts — copy-paste ready

URL: https://nesh.kkweb.io · Repo: https://github.com/piro0919/nesh · SDK: https://www.npmjs.com/package/@piro0919/next-push

Recommended order, weakest-to-strongest in irreversibility (so you can adjust the pitch as you go):

1. **dev.to** — write-up, indexed forever, no harm if it flops
2. **r/SideProject** — friendly to indie launches
3. **r/nextjs** — the natural audience, but stricter on self-promo (post once, be active in comments)
4. **Hacker News (Show HN)** — one shot, fire when you can babysit comments for ~6h, ideally Tue–Thu 9–11am EST

Skip Product Hunt for now — it's a "launch day" thing that benefits from preparation (hunter, assets, scheduled drop). Do it later as a separate event.

---

## 1. dev.to article

**Title:** Building a tiny Web Push SaaS as an alternative to OneSignal

**Tags:** `nextjs` `webdev` `opensource` `saas`

**Cover image:** use https://nesh.kkweb.io/opengraph-image (download, upload as cover)

**Body:**

```markdown
I needed Web Push notifications for a Next.js side project. OneSignal felt like overkill — segmentation, journeys, A/B tests, a dashboard the size of a small SaaS — when all I wanted was: subscribe a browser, send a notification.

So I built [Nesh](https://nesh.kkweb.io). Open source, MIT, free during early access (with caps). It's deployed at https://nesh.kkweb.io and the code is at https://github.com/piro0919/nesh.

## What it is

- Sign up, create a project, get a `apiBase` + VAPID public key
- Drop the SDK in (`@piro0919/next-push`), pass the two values to `usePush`
- Send notifications from the dashboard (immediate or scheduled) or via REST API
- That's it

## The stack

- Next.js 16 (App Router, Server Actions, the new `proxy.ts`)
- Supabase for Postgres + Auth + RLS
- Vercel Cron for scheduled sends
- shadcn/ui + Tailwind
- `web-push` server-side, AES-256-GCM at-rest encryption for VAPID private keys

The whole thing fits in roughly 3 tables: `projects`, `subscriptions`, `notifications`.

## SDK example

```tsx
'use client';
import { usePush } from "@piro0919/next-push";

export function Subscribe() {
  const { subscribe } = usePush({
    apiBase: "https://nesh.kkweb.io/api/v1/projects/<projectId>",
    vapidPublicKey: "<VAPID public key>",
    // Optional: scope by your own user id so you can target later
    userId: currentUser.id,
  });
  return <button onClick={subscribe}>Enable notifications</button>;
}
```

The same SDK works against your own `/api/push` route if you'd rather self-host the backend half — it's framework-agnostic on the server (Hono / Bun / Cloudflare Workers / Deno all work).

## REST API

```bash
curl -X POST https://nesh.kkweb.io/api/v1/projects/<id>/notifications \
  -H "Authorization: Bearer nesh_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello",
    "body": "From the API",
    "url": "https://example.com",
    "userIds": ["alice"]
  }'
```

`userIds` is optional — omit it to broadcast.

## Free tier (and why caps)

I'm one developer. To keep this sustainable without VC money, the free tier is hard-capped:

- 1 project per user
- 5,000 subscribers per project
- 10,000 sends per project per UTC month

If you outgrow it, please tell me — I haven't decided long-term pricing yet, and that signal genuinely helps.

## Why I'm posting

Two reasons:
1. If you've ever wanted "the boring 5% of OneSignal" I'd love to know if Nesh is what you wanted.
2. The SDK ([`@piro0919/next-push`](https://www.npmjs.com/package/@piro0919/next-push)) is decoupled — you can use it with any backend, not just Nesh.

Source, MIT, self-host friendly. PRs welcome. Feedback even more welcome.

— [@piro0919](https://github.com/piro0919)
```

---

## 2. r/SideProject

**Title:** I built a lightweight Web Push SaaS as an alternative to OneSignal — open source, free tier

**Body:**

```markdown
Hi r/SideProject!

I run a couple of small Next.js side projects and kept needing Web Push notifications. OneSignal works, but the dashboard is built for marketing teams running A/B tests on millions of users — way more than I needed. So I built **Nesh**: https://nesh.kkweb.io

**What it does:** sign up → create a project → drop a tiny SDK in → send notifications from the dashboard or REST API. That's all. No segmentation, no journeys, no A/B.

**Stack:** Next.js 16, Supabase, Vercel Cron, web-push. MIT licensed, code at https://github.com/piro0919/nesh.

**Free tier (early access):** 1 project, 5K subscribers, 10K sends/month. Enough for most personal projects. If you'd hit that ceiling I'd genuinely like to hear about it — long-term pricing isn't decided yet.

It's a one-person side project, not a venture-backed startup. Honest about it in the FAQ. Happy to answer questions and take harsh feedback.
```

---

## 3. r/nextjs

> ⚠️ Read [the rules](https://www.reddit.com/r/nextjs/about/rules) before posting. Some subs require flair / weekly threads for self-promo. As of writing r/nextjs allows project shares but expects substance.

**Title:** Nesh — open source Web Push SaaS for Next.js apps (alternative to OneSignal)

**Body:**

```markdown
Hi r/nextjs,

I built Nesh — https://nesh.kkweb.io — a lightweight Web Push notification service for Next.js / React apps. It's open source (MIT), deployed on Vercel + Supabase, and free during early access.

**The pitch in one sentence:** if OneSignal feels like 95% feature bloat for your use case, Nesh is the boring 5%.

**Next.js-specific bits:**
- Built on Next.js 16 (App Router, Server Actions, the new `proxy.ts` middleware replacement)
- The SDK is `@piro0919/next-push` — a `usePush()` hook + a service worker helper
- Drop it into a Client Component, pass the project's `apiBase` + VAPID public key, you get `subscribe / unsubscribe` and the rest
- Same SDK works against your own `/api/push` if you don't want the SaaS half
- TypeScript end-to-end, Server Actions for the dashboard

```tsx
'use client';
import { usePush } from "@piro0919/next-push";

const { subscribe } = usePush({
  apiBase: "https://nesh.kkweb.io/api/v1/projects/<id>",
  vapidPublicKey: "<key>",
  userId: user.id, // optional, for targeted sends
});
```

**REST API** for sending from your backend:
```
POST /api/v1/projects/<id>/notifications
Authorization: Bearer nesh_sk_...
{ "title": "...", "body": "...", "userIds": ["alice"] }
```

**Free tier hard caps** (because I'm one person, not VC-funded):
- 1 project / user
- 5,000 subscribers / project
- 10,000 sends / month

Repo: https://github.com/piro0919/nesh
SDK: https://www.npmjs.com/package/@piro0919/next-push

I'd love feedback — what's missing, what's confusing, what would make you actually use it. Happy to take rough criticism.
```

---

## 4. Hacker News — Show HN

> Fire when you have ~6 hours to babysit comments. Tue–Thu morning EST.
>
> Submit at https://news.ycombinator.com/submit

**Title:** `Show HN: Nesh – open-source Web Push SaaS, alternative to OneSignal`

**URL field:** `https://nesh.kkweb.io`

**Text field:** *(leave empty if URL is set, OR use the version below)*

```
Hi HN — I'm a solo dev who kept reaching for OneSignal on small Next.js side projects and finding it overkill. So I built Nesh: a deliberately small Web Push SaaS. Sign up, create a project, drop a tiny SDK in (`@piro0919/next-push`), and send notifications from the dashboard or a REST API. No segmentation, journeys, or A/B.

Stack: Next.js 16 + Supabase (Postgres + Auth + RLS) + Vercel Cron. MIT licensed. The SDK is decoupled — works with your own backend if you'd rather skip the hosted half.

Free tier is hard-capped (1 project / 5K subs / 10K sends per month) because I'm one person, not VC-funded. If you outgrow it I'd genuinely like to hear that — long-term pricing isn't decided.

Code: https://github.com/piro0919/nesh
SDK: https://www.npmjs.com/package/@piro0919/next-push

Happy to discuss design choices: why I picked Supabase RLS over JWT-only, why I encrypted VAPID private keys at rest, why dashboard-first instead of API-first, etc.
```

**First comment to post yourself (right after submitting):**

```
Author here. A few design notes that didn't fit in the post:

- Subscriptions table has an `external_user_id` column so you can target sends by your app's user id, not just by raw push endpoint. Set it via `usePush({ userId })` in the SDK.
- VAPID private keys are stored encrypted (AES-256-GCM) at rest. The dashboard never reads them; only the send-time service decrypts.
- `/api/v1/projects/<id>/notifications` rate-limits by IP × project × action (60/min) and there's a per-month send cap before the 10K wall.
- Cron is a single Vercel cron at `* * * * *` that pulls pending+past-due notifications and idempotently sends.

Happy to take rough feedback.
```

---

## 5. Product Hunt (deferred — do as a "launch day" later)

When you're ready, prep:
- Tagline: "Web Push notifications, made simple"
- Description: same dev.to opener
- Gallery: 3 screenshots (LP hero, dashboard "New notification", history with delivery stats)
- Maker profile filled out
- Pre-launch followers ("notify me on launch")
- Schedule for a Tuesday or Wednesday 12:01am PT

Don't fire it on the same day as HN — split the energy.
