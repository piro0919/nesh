# MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nesh MVP の土台(Lint/Format、Supabase 接続、shadcn/ui、DB スキーマ + RLS)を整備し、以降の機能実装が即座に始められる状態にする。

**Architecture:** Next.js 16 App Router の `src/` 配下に Supabase クライアントヘルパーを置き、Supabase CLI でローカル DB を立てる。マイグレーションで 3 テーブル(`projects` / `subscriptions` / `notifications`)と RLS ポリシーを定義し、`supabase gen types typescript` で生成した型を全クエリで使う。Lint/Format は Biome、UI コンポーネントは shadcn/ui。

**Tech Stack:** Next.js 16.2 / React 19.2 / TypeScript 5 / Tailwind v4 / Biome / Supabase (CLI + JS SDK + SSR helpers) / shadcn/ui / pnpm

> **重要:** Next.js 16 は破壊的変更を含む。**`middleware.ts` は `proxy.ts` にリネームされた**(本プランでは proxy を使用)。実装中に Next.js API で迷ったら `node_modules/next/dist/docs/01-app/` 配下のドキュメントを必ず参照すること。

---

## File Structure

作成・変更するファイル一覧:

### 作成

- `biome.json` — Biome 設定
- `.env.example` — 環境変数テンプレート
- `.env.local` — ローカル環境変数(`.gitignore` 済み)
- `supabase/config.toml` — Supabase CLI 設定(`supabase init` で生成)
- `supabase/migrations/<timestamp>_initial_schema.sql` — 3 テーブル + インデックス + RLS
- `src/lib/supabase/server.ts` — Server Component / Route Handler 用クライアント
- `src/lib/supabase/client.ts` — Client Component 用クライアント
- `src/lib/supabase/database.types.ts` — `supabase gen types` の出力(自動生成)
- `src/proxy.ts` — Supabase auth セッション更新用の Next.js Proxy
- `src/lib/utils.ts` — shadcn/ui の `cn` ヘルパー(`shadcn init` で生成)
- `components.json` — shadcn/ui 設定(`shadcn init` で生成)

### 変更

- `package.json` — 依存追加 + scripts(`lint`, `format`, `db:start`, `db:reset`, `db:types`)
- `.gitignore` — `.env*.local`, `supabase/.temp` などを追加
- `src/app/layout.tsx` — フォントの簡素化(後の UI 実装で再変更)
- `src/app/page.tsx` — 初期テンプレートを最小プレースホルダに置換
- `src/app/globals.css` — Tailwind v4 + shadcn/ui の CSS 変数を統合
- `tsconfig.json` — `@/*` パスエイリアス確認(既に設定済みなら no-op)

### 削除

- `public/*.svg`(`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) — 不使用テンプレ画像

---

## Task 1: Biome 導入

**Files:**
- Create: `biome.json`
- Modify: `package.json`

- [ ] **Step 1: Biome をインストール**

```bash
pnpm add -D -E @biomejs/biome
```

- [ ] **Step 2: Biome 初期設定ファイルを生成**

```bash
pnpm exec biome init
```

これで `biome.json` が生成される。

- [ ] **Step 3: `biome.json` を Next.js / Tailwind v4 向けに調整**

`biome.json` を以下で上書き:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**", "!**/node_modules", "!.next", "!supabase/.temp", "!src/lib/supabase/database.types.ts"]
  },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "useImportType": "error" },
      "correctness": { "noUnusedImports": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always", "trailingCommas": "all" } }
}
```

(注: 上記は Biome 2.x 想定。インストールしたバージョンの `$schema` URL に合わせること。)

- [ ] **Step 4: `package.json` に scripts を追加**

`package.json` の `scripts` を以下にする:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format --write ."
  }
}
```

- [ ] **Step 5: lint と format が動くことを確認**

```bash
pnpm format
pnpm lint
```

期待: format は既存ファイルを整形して終了。lint はエラー 0(または既存テンプレ由来の警告のみ)。

- [ ] **Step 6: コミット**

```bash
git add biome.json package.json pnpm-lock.yaml src
git commit -m "chore: introduce biome for lint and format"
```

---

## Task 2: 不要なテンプレートファイルを削除

**Files:**
- Delete: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: 不要 SVG を削除**

```bash
rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 2: `src/app/page.tsx` を最小プレースホルダに置換**

```tsx
export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Nesh</h1>
    </main>
  );
}
```

- [ ] **Step 3: `src/app/layout.tsx` をシンプル化**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nesh",
  description: "A simple Web Push notification SaaS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: `src/app/globals.css` を Tailwind v4 のみに**

```css
@import "tailwindcss";
```

(shadcn/ui のテーマ変数は Task 8 で追記する。)

- [ ] **Step 5: dev サーバで起動確認**

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` を開き「Nesh」が中央に表示されることを確認。確認後 Ctrl+C で停止。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "chore: strip starter template assets"
```

---

## Task 3: 環境変数テンプレート整備

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: `.env.example` を作成**

```bash
# Supabase (local: from `supabase start` output / prod: from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 2: `.gitignore` に Supabase / env を追記**

`.gitignore` の末尾に以下を追加(既存行に重複がなければ):

```
# env files
.env
.env*.local

# supabase
supabase/.branches
supabase/.temp
```

- [ ] **Step 3: コミット**

```bash
git add .env.example .gitignore
git commit -m "chore: add env template and ignore supabase scratch dirs"
```

---

## Task 4: Supabase CLI セットアップ

**Files:**
- Create: `supabase/config.toml`(`supabase init` で生成)
- Modify: `package.json`

前提: Docker Desktop または Colima が起動していること。

- [ ] **Step 1: Supabase CLI を dev 依存に追加**

```bash
pnpm add -D supabase
```

- [ ] **Step 2: Supabase プロジェクトを初期化**

```bash
pnpm exec supabase init
```

`supabase/config.toml` ほかが生成される。生成時に VS Code 設定の質問が出たら N で OK。

- [ ] **Step 3: `package.json` に Supabase scripts を追加**

`scripts` を以下に拡張:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format --write .",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --local > src/lib/supabase/database.types.ts"
  }
}
```

- [ ] **Step 4: ローカル Supabase を起動**

```bash
pnpm db:start
```

初回はイメージ pull で数分かかる。出力に `API URL`, `anon key`, `service_role key` が表示される。

- [ ] **Step 5: `.env.local` に anon / service_role キーを書き込む**

`pnpm db:start` の出力からコピーして `.env.local` を作成:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

`.env.local` は `.gitignore` 済みなのでコミットされない。

- [ ] **Step 6: コミット**

```bash
git add supabase package.json pnpm-lock.yaml
git commit -m "chore: bootstrap supabase local stack"
```

---

## Task 5: 初期マイグレーション(3 テーブル + インデックス + RLS)

**Files:**
- Create: `supabase/migrations/<timestamp>_initial_schema.sql`

- [ ] **Step 1: マイグレーションファイルを作成**

```bash
pnpm exec supabase migration new initial_schema
```

`supabase/migrations/<timestamp>_initial_schema.sql` が空ファイルで生成される。

- [ ] **Step 2: マイグレーション SQL を書く**

生成されたファイルに以下を書き込む:

```sql
-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vapid_public_key text not null,
  vapid_private_key text not null,
  vapid_subject text not null,
  created_at timestamptz not null default now()
);
create index projects_user_id_idx on public.projects(user_id);

-- subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (project_id, endpoint)
);
create index subscriptions_project_id_idx on public.subscriptions(project_id);
create index subscriptions_endpoint_idx on public.subscriptions(endpoint);

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  body text not null,
  url text,
  scheduled_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent')),
  created_at timestamptz not null default now()
);
create index notifications_dispatch_idx
  on public.notifications(project_id, status, scheduled_at);

-- RLS
alter table public.projects enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

-- projects: owner only
create policy "projects_owner_select" on public.projects
  for select using (user_id = auth.uid());
create policy "projects_owner_insert" on public.projects
  for insert with check (user_id = auth.uid());
create policy "projects_owner_update" on public.projects
  for update using (user_id = auth.uid());
create policy "projects_owner_delete" on public.projects
  for delete using (user_id = auth.uid());

-- subscriptions: owner of parent project
create policy "subscriptions_owner_select" on public.subscriptions
  for select using (
    exists (select 1 from public.projects p
            where p.id = subscriptions.project_id and p.user_id = auth.uid())
  );
create policy "subscriptions_owner_delete" on public.subscriptions
  for delete using (
    exists (select 1 from public.projects p
            where p.id = subscriptions.project_id and p.user_id = auth.uid())
  );
-- subscriptions の INSERT は anon にも許可(SDK が直接叩く)
-- projectId 存在検証はサーバーハンドラ側で行うため、RLS 上は無条件 allow
create policy "subscriptions_public_insert" on public.subscriptions
  for insert with check (true);

-- notifications: owner of parent project
create policy "notifications_owner_all" on public.notifications
  for all using (
    exists (select 1 from public.projects p
            where p.id = notifications.project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p
            where p.id = notifications.project_id and p.user_id = auth.uid())
  );
```

- [ ] **Step 3: マイグレーションを適用**

```bash
pnpm db:reset
```

`supabase db reset` はローカル DB を破棄して migrations をすべて再適用する。エラーなく `Finished supabase db reset` が出れば OK。

- [ ] **Step 4: スキーマ確認**

```bash
pnpm exec supabase db diff
```

期待: 出力に差分なし(マイグレーションと現状 DB が一致)。

- [ ] **Step 5: コミット**

```bash
git add supabase/migrations
git commit -m "feat(db): add initial schema with rls for projects/subscriptions/notifications"
```

---

## Task 6: TypeScript 型生成

**Files:**
- Create: `src/lib/supabase/database.types.ts`(自動生成)

- [ ] **Step 1: 型を生成**

```bash
mkdir -p src/lib/supabase
pnpm db:types
```

`src/lib/supabase/database.types.ts` に `Database` 型が生成される。

- [ ] **Step 2: 中身を軽くチェック**

ファイルを開いて `Database['public']['Tables']` に `projects`, `subscriptions`, `notifications` が含まれていることを目視確認。

- [ ] **Step 3: コミット**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "chore(db): generate typescript types from local supabase"
```

---

## Task 7: Supabase クライアントヘルパー + Proxy

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/proxy.ts`
- Modify: `package.json`(`@supabase/ssr`, `@supabase/supabase-js` 追加)

> Next.js 16 では従来の `middleware.ts` が **`proxy.ts`** にリネームされた。本タスクではこの新名称を使う。詳細は `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` 参照。

- [ ] **Step 1: 依存追加**

```bash
pnpm add @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: Server クライアント**

`src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component から呼ばれた場合は set 不可。Proxy で更新済みなので無視。
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Browser クライアント**

`src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: Proxy(セッション更新)**

`src/proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // セッショントークンの自動更新
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 5: dev サーバで起動確認**

```bash
pnpm dev
```

`http://localhost:3000` を開いて 200 が返ること、ブラウザコンソール / サーバーログにエラーが出ていないことを確認。Ctrl+C で停止。

- [ ] **Step 6: lint + format**

```bash
pnpm format
pnpm lint
```

エラー 0 を確認。

- [ ] **Step 7: コミット**

```bash
git add src/lib/supabase src/proxy.ts package.json pnpm-lock.yaml
git commit -m "feat(auth): add supabase ssr clients and session-refresh proxy"
```

---

## Task 8: shadcn/ui 初期化

**Files:**
- Create: `components.json`, `src/lib/utils.ts`(shadcn init で生成)
- Modify: `src/app/globals.css`, `tsconfig.json`(必要時)

- [ ] **Step 1: shadcn CLI を実行**

```bash
pnpm dlx shadcn@latest init
```

対話プロンプトに以下で回答:
- Style → `New York`
- Base color → `Neutral`
- CSS variables → `Yes`

これで `components.json`, `src/lib/utils.ts` 生成、`src/app/globals.css` がテーマ変数で更新される。

- [ ] **Step 2: 動作確認用に Button コンポーネントを追加**

```bash
pnpm dlx shadcn@latest add button
```

`src/components/ui/button.tsx` が追加される。

- [ ] **Step 3: `src/app/page.tsx` で Button を使って動作確認**

一時的に:

```tsx
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Button>Nesh</Button>
    </main>
  );
}
```

- [ ] **Step 4: dev で表示確認**

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` を開き、shadcn の Button スタイル(角丸 + ホバー)で「Nesh」が表示されることを確認。Ctrl+C で停止。

- [ ] **Step 5: lint + format**

```bash
pnpm format
pnpm lint
```

エラー 0 を確認。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat(ui): initialize shadcn/ui with button component"
```

---

## Task 9: README にローカル起動手順を追記

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README の "Local development" セクションを更新**

`README.md` の `## Local development` セクションを以下に置換:

```markdown
## Local development

Prerequisites:

- Node.js 20+
- pnpm 9+
- Docker Desktop or Colima (for local Supabase)

\`\`\`bash
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
\`\`\`

Other useful scripts:

- `pnpm db:types` — regenerate `src/lib/supabase/database.types.ts` from the local schema
- `pnpm db:stop` — stop the local Supabase stack
- `pnpm lint` / `pnpm format` — Biome
```

(README に書き込む際はバックスラッシュエスケープ不要 — 上は本プラン内の表示用エスケープ。)

- [ ] **Step 2: コミット**

```bash
git add README.md
git commit -m "docs: document local supabase + dev workflow"
```

---

## Task 10: HANDOFF.md を更新

**Files:**
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: 完了済みタスクを反映**

`docs/HANDOFF.md` の「現状」と「次のステップ」を、本プラン完了時点の状態に更新する:

- 「現状」に「Biome / Supabase ローカル / shadcn/ui 導入済み、初期マイグレーション(projects/subscriptions/notifications)完了」を追記
- 「次のステップ」の 1〜4(プラン作成〜マイグレーション)に取り消し線を引く、または削除
- 残ステップとして「認証フロー実装」以降を残す
- 関連ファイルとして `docs/plan/2026-05-05-mvp-foundation.md` へのリンクを追加

- [ ] **Step 2: コミット**

```bash
git add docs/HANDOFF.md
git commit -m "docs: update handoff after foundation setup"
```

---

## 完了条件

すべてのタスク完了後、以下が満たされていること:

- [ ] `pnpm lint` がエラー 0
- [ ] `pnpm dev` で `http://localhost:3000` が 200 で表示される
- [ ] `pnpm db:start && pnpm db:reset` でローカル DB が立ち上がり、`projects` / `subscriptions` / `notifications` テーブルが存在する
- [ ] `pnpm db:types` で `src/lib/supabase/database.types.ts` が再生成できる
- [ ] `src/proxy.ts` 経由で Supabase auth セッションが更新される(以後の認証実装で前提)
- [ ] shadcn/ui の `<Button>` が動作する

これらが揃った時点で **Plan 2(認証 + プロジェクト CRUD)** に進める。
