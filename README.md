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

Prerequisites:

- Node.js 20+
- pnpm 9+
- Docker Desktop or Colima (for local Supabase)

```bash
# 1. install deps
pnpm install

# 2. start local supabase (postgres + auth + studio)
pnpm db:start

# 3. copy the printed anon / service_role keys into .env.local
cp .env.example .env.local
# then edit .env.local

# 4. apply migrations + reset db
pnpm db:reset

# 5. run next.js
pnpm dev
```

Other useful scripts:

- `pnpm db:types` — regenerate `src/lib/supabase/database.types.ts` from the local schema
- `pnpm db:stop` — stop the local Supabase stack
- `pnpm lint` / `pnpm format` — Biome

## License

MIT
