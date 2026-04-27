# Nesh

A simple Web Push notification SaaS for Next.js / React developers. The hosted alternative to running [`@piro0919/next-push`](https://github.com/piro0919/next-push) yourself — sign up, drop the SDK in, and start sending.

> **Status:** Early development. Not yet released.

## Positioning

Nesh is to OneSignal what Umami is to Google Analytics: a lighter, simpler alternative for people who find the incumbents too heavy. Built and operated by a single developer; OSS under MIT.

## Stack

- Next.js 16 (App Router)
- Supabase (Postgres + Auth + RLS)
- shadcn/ui + Tailwind CSS
- Vercel (hosting + Cron)
- [`@piro0919/next-push`](https://github.com/piro0919/next-push) for the actual sending

## Local development

```bash
pnpm install
pnpm dev
```

## License

MIT
