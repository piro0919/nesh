# Landing Page Implementation Plan

**Goal:** 未ログイン状態で `/` に来た訪問者に Nesh が何で / どう使うか / どこから始めるかを伝える簡易 LP を作る。ログイン済の場合は従来通り `/projects` に redirect。

**Architecture:**
- `src/app/page.tsx` を「auth 状態でディスパッチする Server Component」に変える: 既存のログイン → /projects redirect は残し、未ログイン時だけ `<LandingPage>` を描画
- `src/app/_components/landing-page.tsx` に LP 本体 (Server Component、shadcn/ui の Button + Tailwind v4)
- セクション構成: Hero / Why / How it works (3 step + コードスニペット) / FAQ / Footer
- メタデータ: title, description, OG image (LP に組み込む形)、X(Twitter) Card 対応

**Tech Stack:** Next.js 16 App Router (Server Components) / shadcn/ui (Button) / Tailwind v4 / `next/font` 既存 Geist

**Tone:** 「機能を絞ったシンプルな Web Push SaaS」「OneSignal の Umami」を素直に伝える。文体は英語ベース、専門用語は避けすぎない (ターゲットは個人開発者)。

---

## File Structure

### 作成
- `src/app/_components/landing-page.tsx` — LP 本体
- `src/app/_components/landing-feature.tsx` — Why セクションのカード(3 件)
- `src/app/_components/landing-step.tsx` — How it works のステップ(3 件)

### 変更
- `src/app/page.tsx` — auth 済なら /projects redirect、未認証なら `<LandingPage>` を描画
- `src/app/layout.tsx` — `<html lang>` を `en` に変更(LP/UI が英語ベースなので整合)、metadata を OG/Twitter 対応に拡張

---

## Task 1: page.tsx ディスパッチャ + LandingPage 雛形

Files:
- Modify: `src/app/page.tsx`
- Create: `src/app/_components/landing-page.tsx`

`src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "./_components/landing-page";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/projects");
  return <LandingPage />;
}
```

`src/app/_components/landing-page.tsx` 雛形 (内容は Task 2-4 で詰める):

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero, Why, How, FAQ, Footer をここに */}
      <header className="px-6 py-4 flex items-center justify-between">
        <span className="font-semibold">Nesh</span>
        <Button asChild variant="outline" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </header>
      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
          <h1 className="text-4xl font-semibold">Nesh</h1>
          <p className="text-muted-foreground">Coming soon.</p>
        </section>
      </main>
    </div>
  );
}
```

Verify:
```bash
pnpm format && pnpm lint && pnpm exec tsc --noEmit
pnpm dev # 別ターミナルで動作確認
```

未ログインで `https://localhost:3000/` が 200 + "Nesh" を返すこと。

Commit:
```bash
git add src/app/page.tsx src/app/_components/landing-page.tsx
git commit -m "feat(landing): add LP scaffold and dispatch unauth root to it"
```

---

## Task 2: Hero + Header

Header:
- 左: "Nesh" ロゴテキスト (太字) + tagline 小さく "Web Push, made simple"
- 右: "Sign in" / "Get started" (primary)

Hero (`<section>` 直下):
- h1: `Web Push notifications,\nmade simple.`
- 副タイトル: `A lightweight alternative to OneSignal for Next.js / React projects. Sign up, drop the SDK in, start sending — in minutes.`
- CTA 2 つ:
  - Primary: `Get started — free` → `/sign-up`
  - Secondary: `View on GitHub` → `https://github.com/piro0919/nesh`
- 小さく: `Open source · MIT · Self-host friendly`

実装:

```tsx
<header className="border-b">
  <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
    <div className="flex items-baseline gap-3">
      <span className="text-lg font-semibold">Nesh</span>
      <span className="hidden text-xs text-muted-foreground sm:inline">Web Push, made simple</span>
    </div>
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Get started</Link>
      </Button>
    </div>
  </div>
</header>

<section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
    Web Push notifications,
    <br />
    made simple.
  </h1>
  <p className="max-w-xl text-lg text-muted-foreground">
    A lightweight alternative to OneSignal for Next.js / React projects.
    Sign up, drop the SDK in, start sending — in minutes.
  </p>
  <div className="flex flex-wrap items-center justify-center gap-3">
    <Button asChild size="lg">
      <Link href="/sign-up">Get started — free</Link>
    </Button>
    <Button asChild variant="outline" size="lg">
      <Link href="https://github.com/piro0919/nesh" target="_blank" rel="noreferrer">
        View on GitHub
      </Link>
    </Button>
  </div>
  <p className="text-xs text-muted-foreground">Open source · MIT · Self-host friendly</p>
</section>
```

---

## Task 3: Why + How it works

### Why (3 features in cards)

```tsx
<section className="border-t bg-muted/30">
  <div className="mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-3">
    <Feature title="Simple" body="No segmentation, no journeys, no A/B. Just send." />
    <Feature title="Fast to start" body="Sign up → drop the SDK → send your first push in under 5 minutes." />
    <Feature title="Open source" body="MIT licensed. Read the code, fork it, or self-host." />
  </div>
</section>
```

`Feature` 小コンポーネント:

```tsx
function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-background p-6">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
```

### How it works (3 steps + code snippet)

```tsx
<section className="mx-auto max-w-5xl px-6 py-16">
  <h2 className="mb-8 text-center text-2xl font-semibold">How it works</h2>
  <div className="grid gap-8 md:grid-cols-3">
    <Step n={1} title="Create a project" body="Sign up and create a project in the dashboard. We generate VAPID keys for you." />
    <Step n={2} title="Drop in the SDK" body="Install @piro0919/next-push and pass the apiBase + publicKey from your project setup screen." />
    <Step n={3} title="Send" body="Compose a notification in the dashboard. Send immediately or schedule it." />
  </div>
  <pre className="mt-10 overflow-x-auto rounded-lg border bg-muted p-6 text-xs">
    <code>{`'use client';
import { usePush } from "@piro0919/next-push";

export function Subscribe() {
  const { subscribe } = usePush({
    apiBase: "https://nesh.kkweb.io/api/v1/projects/<projectId>",
    publicKey: "<VAPID public key>",
  });
  return <button onClick={subscribe}>Enable notifications</button>;
}`}</code>
  </pre>
</section>
```

`Step` 小コンポーネント:

```tsx
function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {n}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
```

---

## Task 4: FAQ + Footer + metadata

### FAQ (簡素に 4 項目程度)

```tsx
<section className="border-t bg-muted/30">
  <div className="mx-auto max-w-3xl px-6 py-16">
    <h2 className="mb-8 text-center text-2xl font-semibold">FAQ</h2>
    <div className="flex flex-col gap-6 text-sm">
      <Faq q="Is it free?" a="Yes, free during the early phase. Long-term pricing isn't decided yet — Nesh is a side project run by one developer, not a VC-backed startup." />
      <Faq q="Why not just use OneSignal?" a="OneSignal is great if you need segmentation, A/B, journeys. Nesh is for people who find that overkill and want a tiny dashboard with the essentials." />
      <Faq q="Can I self-host?" a="Technically yes — the code is MIT and runs on any Postgres + Vercel-compatible host. Documentation for self-hosting is on the roadmap." />
      <Faq q="What about iOS / Android native?" a="Web Push only for now. Web Push works on iOS Safari (16.4+) when installed as a PWA." />
    </div>
  </div>
</section>
```

`Faq` 小コンポーネント:

```tsx
function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="mb-1 font-medium">{q}</h3>
      <p className="text-muted-foreground">{a}</p>
    </div>
  );
}
```

### Footer

```tsx
<footer className="border-t">
  <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
    <span>© 2026 Nesh · MIT</span>
    <div className="flex items-center gap-4">
      <Link href="https://github.com/piro0919/nesh" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</Link>
      <Link href="https://github.com/piro0919/next-push" target="_blank" rel="noreferrer" className="hover:text-foreground">SDK</Link>
    </div>
  </div>
</footer>
```

### metadata 拡張 (`src/app/layout.tsx`)

```tsx
export const metadata: Metadata = {
  title: "Nesh — Web Push, made simple",
  description: "A lightweight Web Push SaaS for Next.js / React projects. The hosted alternative to OneSignal — sign up, drop the SDK in, start sending.",
  metadataBase: new URL("https://nesh.kkweb.io"),
  openGraph: {
    title: "Nesh — Web Push, made simple",
    description: "Lightweight Web Push for Next.js / React. Sign up, drop the SDK in, start sending.",
    url: "https://nesh.kkweb.io",
    siteName: "Nesh",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nesh — Web Push, made simple",
    description: "Lightweight Web Push for Next.js / React. Sign up, drop the SDK in, start sending.",
  },
};
```

`<html lang="ja">` を `<html lang="en">` に変更 (LP / UI 全体が英語のため)。

Verify:
```bash
pnpm format && pnpm lint && pnpm exec tsc --noEmit
```

dev で `/` 表示、`/sign-up` への遷移、レスポンシブ確認 (mobile/desktop)。

Commit:
```bash
git add -A
git commit -m "feat(landing): add hero/why/how/faq/footer and og metadata"
```

---

## Task 5: デプロイ + 動作確認

main にマージ → push すると Vercel 自動デプロイ。

確認項目:
- [ ] 未ログインで `https://nesh.kkweb.io/` が LP を表示
- [ ] ログイン済で `/` が `/projects` に redirect
- [ ] OG メタが正しい (curl で確認、後日 Twitter Card validator)
- [ ] モバイル幅で崩れない (Vercel preview を実機で確認)

完了条件:
- LP が公開 URL で見える
- "Get started" → /sign-up が動く
- 既存のログイン済ユーザーフローが壊れていない
