# Nesh sample — Next.js

A minimal Next.js 16 app that subscribes to Web Push via Nesh.

## Setup

1. Sign up at https://nesh.kkweb.io and create a project.
2. Copy `apiBase` and `publicKey` from the project's "SDK setup" card.
3. From this directory:

   ```bash
   pnpm install
   cp .env.example .env.local
   # edit .env.local — paste apiBase and publicKey
   pnpm dev
   ```

4. Open http://localhost:3000 in a browser that supports Web Push (Chrome, Firefox, or iOS Safari 16.4+ as a PWA).
5. Click **Enable notifications** and accept the permission prompt.
6. Go back to the Nesh dashboard. The project should now show **1 subscriber**.
7. Click **Send notification** on the project page, fill in title + body, choose **Immediately**, and submit.
8. The notification should appear in your browser within a few seconds.

## Files

- `app/page.tsx` — uses `usePush({ apiBase, vapidPublicKey })`
- `public/sw.js` — push / click / subscriptionchange handlers (vanilla, no build step)
- `.env.example` — required env vars

## Notes

- Service worker scope: `/` (default). The SW must be served over HTTPS in production. `localhost` works without TLS.
- This sample uses **`apiBase`** (added in `@piro0919/next-push@0.4.0`) so all subscribe POST / unsubscribe DELETE go to the Nesh hosted endpoint.
- For production (deployed) usage, the same `apiBase` value works regardless of which origin serves your app — Nesh accepts cross-origin requests via CORS.
