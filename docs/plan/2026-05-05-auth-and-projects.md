# Auth + Projects CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase Auth によるサインアップ / サインイン / サインアウトと、プロジェクト CRUD(一覧、作成 with VAPID 自動生成、詳細シェル、削除)を実装する。Plan 1 の基盤(Supabase クライアント、proxy、shadcn/ui)の上に乗せる。

**Architecture:**
- 認証: Supabase Auth の email/password。Mailpit(`localhost:54324`)が確認メールを受け取るのでローカルで完結。Server Action で `signUp` / `signInWithPassword` / `signOut` を呼び、`src/proxy.ts` がセッション cookie を維持する。
- ルーティング: `(auth)` と `(dashboard)` を Route Group に分け、`(dashboard)` 配下は layout で `getUser()` を呼んで未ログインなら `/sign-in` に redirect。
- VAPID 鍵生成: `web-push` パッケージの `generateVAPIDKeys()` をプロジェクト作成 Server Action 内で呼び、`projects` テーブルに保存。`vapid_subject` はユーザーのメールアドレスを `mailto:` で使う。
- フォーム: shadcn/ui の `Input` / `Label` / `Form`(react-hook-form + zod) を入れて型安全な validation。
- データ取得: Server Component から `createClient()` で Supabase に問い合わせ、RLS が user スコープを担保。

**Tech Stack:** Next.js 16 App Router (Server Components + Server Actions) / Supabase Auth (email+password) / shadcn/ui Form (react-hook-form + zod) / web-push (VAPID 生成のみ) / Tailwind v4

> **Next.js 16 注意:** `middleware.ts` ではなく `proxy.ts`(Plan 1 で導入済み)。Server Action は `"use server"` ディレクティブ、`redirect()` は throw 形式なので try/catch で握り潰さない。

---

## File Structure

### 作成

- `src/app/(auth)/layout.tsx` — auth 画面の最小レイアウト(中央寄せのみ)
- `src/app/(auth)/sign-in/page.tsx` — サインインページ
- `src/app/(auth)/sign-up/page.tsx` — サインアップページ
- `src/app/(auth)/_components/auth-form.tsx` — サインイン/アップ共通フォーム(`mode` prop で切替)
- `src/app/(auth)/_actions.ts` — `signIn` / `signUp` / `signOut` Server Actions
- `src/app/(dashboard)/layout.tsx` — ダッシュボード共通レイアウト(認証ガード + ヘッダ + サインアウトボタン)
- `src/app/(dashboard)/projects/page.tsx` — プロジェクト一覧
- `src/app/(dashboard)/projects/new/page.tsx` — プロジェクト作成フォーム
- `src/app/(dashboard)/projects/[projectId]/page.tsx` — プロジェクト詳細(MVP では基本情報 + 削除ボタンのみ。SDK 情報・購読者数は Plan 3 で追加)
- `src/app/(dashboard)/projects/_actions.ts` — `createProject` / `deleteProject` Server Actions
- `src/lib/vapid.ts` — `generateVapidKeys()` ラッパー(web-push の出力を typed に)
- `src/lib/auth.ts` — `getCurrentUser()` ヘルパー(Server Component 用、未ログインなら redirect)
- `src/components/ui/input.tsx` — shadcn add input
- `src/components/ui/label.tsx` — shadcn add label
- `src/components/ui/form.tsx` — shadcn add form (react-hook-form + zod)
- `src/components/ui/card.tsx` — shadcn add card
- `src/components/ui/sonner.tsx` — shadcn add sonner (トースト通知用)

### 変更

- `src/app/page.tsx` — 認証済みなら `/projects` へ、未認証なら `/sign-in` へ redirect する root
- `package.json` — 依存追加(`web-push`, `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner`)
- `src/app/layout.tsx` — `<Toaster />` を body 末尾に追加(sonner)

---

## Task 1: 共通の依存追加とユーティリティ

**Files:**
- Create: `src/lib/vapid.ts`, `src/lib/auth.ts`
- Modify: `package.json`

- [ ] **Step 1: 依存追加**

```bash
pnpm add web-push react-hook-form zod @hookform/resolvers sonner
pnpm add -D @types/web-push
```

- [ ] **Step 2: shadcn コンポーネントを追加**

```bash
pnpm dlx shadcn@latest add input label form card sonner
```

生成されたファイルが lint で引っかかったら `pnpm exec biome check --write src/components/ui` で auto-fix する(Plan 1 の Task 8 と同じ運用)。

- [ ] **Step 3: VAPID ヘルパー**

`src/lib/vapid.ts`:

```ts
import webpush from "web-push";

export type VapidKeys = {
  publicKey: string;
  privateKey: string;
};

export function generateVapidKeys(): VapidKeys {
  return webpush.generateVAPIDKeys();
}
```

- [ ] **Step 4: 認証ヘルパー**

`src/lib/auth.ts`:

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect("/sign-in");
  }
  return data.user;
}
```

- [ ] **Step 5: lint + format**

```bash
pnpm format
pnpm lint
```

- [ ] **Step 6: コミット**

```bash
git add src/lib/vapid.ts src/lib/auth.ts src/components/ui package.json pnpm-lock.yaml components.json
git commit -m "feat: add vapid helper, auth guard, and shadcn form/card/input/label/sonner"
```

---

## Task 2: 認証フォーム + Server Actions

**Files:**
- Create: `src/app/(auth)/layout.tsx`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, `src/app/(auth)/_components/auth-form.tsx`, `src/app/(auth)/_actions.ts`

- [ ] **Step 1: Server Actions**

`src/app/(auth)/_actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | undefined;

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  redirect("/projects");
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/projects");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
```

注: Supabase ローカルではデフォルトでメール確認が必要。`supabase/config.toml` の `[auth.email] enable_confirmations = false` がデフォルト false のはずなので、サインアップ後即ログインできる。確認が有効になっていたら Mailpit(`http://127.0.0.1:54324`)で確認メールを開いてリンクを踏む。

- [ ] **Step 2: 共通フォームコンポーネント**

`src/app/(auth)/_components/auth-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, type AuthState } from "../_actions";

type Props = { mode: "sign-in" | "sign-up" };

export function AuthForm({ mode }: Props) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">{mode === "sign-in" ? "Sign in" : "Sign up"}</h1>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
        />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "..." : mode === "sign-in" ? "Sign in" : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {mode === "sign-in" ? (
          <>
            No account? <Link href="/sign-up" className="underline">Sign up</Link>
          </>
        ) : (
          <>
            Have an account? <Link href="/sign-in" className="underline">Sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Auth Layout**

`src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center p-8">{children}</main>;
}
```

- [ ] **Step 4: ページ**

`src/app/(auth)/sign-in/page.tsx`:

```tsx
import { AuthForm } from "../_components/auth-form";

export default function Page() {
  return <AuthForm mode="sign-in" />;
}
```

`src/app/(auth)/sign-up/page.tsx`:

```tsx
import { AuthForm } from "../_components/auth-form";

export default function Page() {
  return <AuthForm mode="sign-up" />;
}
```

- [ ] **Step 5: dev サーバで動作確認**

```bash
pnpm dev > /tmp/nesh-dev.log 2>&1 &
DEV_PID=$!
for i in {1..30}; do
  if curl -sf http://localhost:3000/sign-up > /dev/null 2>&1; then break; fi
  sleep 1
done
curl -s -o /dev/null -w "sign-up %{http_code}\n" http://localhost:3000/sign-up
curl -s -o /dev/null -w "sign-in %{http_code}\n" http://localhost:3000/sign-in
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

期待: 両方 200。

- [ ] **Step 6: lint + format + コミット**

```bash
pnpm format
pnpm lint
git add src/app/\(auth\)
git commit -m "feat(auth): add sign-in/sign-up pages and server actions"
```

---

## Task 3: ダッシュボードレイアウト + サインアウト

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/page.tsx`(root redirect)
- Modify: `src/app/layout.tsx`(`<Toaster />` 追加)

- [ ] **Step 1: ダッシュボードレイアウト**

`src/app/(dashboard)/layout.tsx`:

```tsx
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/(auth)/_actions";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/projects" className="font-semibold">
          Nesh
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user.email}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Root を redirect に**

`src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  redirect(data.user ? "/projects" : "/sign-in");
}
```

- [ ] **Step 3: Toaster を root layout に**

`src/app/layout.tsx` の `<body>` 内最後の子として `<Toaster />` を追加:

```tsx
import { Toaster } from "@/components/ui/sonner";
// ...
<body className={...}>
  {children}
  <Toaster />
</body>
```

(import / 配置以外の既存内容は触らない。shadcn init で自動挿入された Geist フォント設定はそのまま残す。)

- [ ] **Step 4: 動作確認**

```bash
pnpm dev > /tmp/nesh-dev.log 2>&1 &
DEV_PID=$!
for i in {1..30}; do
  if curl -sIf http://localhost:3000 > /dev/null 2>&1; then break; fi
  sleep 1
done
# 未ログインで / → /sign-in に 307 リダイレクト
curl -s -o /dev/null -w "/ -> %{redirect_url} (%{http_code})\n" http://localhost:3000
# 未ログインで /projects → /sign-in に redirect
curl -s -o /dev/null -w "/projects -> %{redirect_url} (%{http_code})\n" http://localhost:3000/projects
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

期待: 両方とも `/sign-in` への 307。

- [ ] **Step 5: lint + format + コミット**

```bash
pnpm format
pnpm lint
git add src/app
git commit -m "feat(dashboard): add layout with auth guard and root redirect"
```

---

## Task 4: プロジェクト一覧

**Files:**
- Create: `src/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: 一覧ページ**

`src/app/(dashboard)/projects/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button asChild>
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">No projects yet. Create your first one.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`} className="block">
                <Card className="transition hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Created {new Date(p.created_at).toLocaleString()}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 動作確認**

ブラウザで手動ログインまでテストするのは subagent では難しいので、コード review レベルで完了とし、Task 5 で create フローと組み合わせて確認する。

```bash
pnpm format
pnpm lint
```

- [ ] **Step 3: コミット**

```bash
git add src/app/\(dashboard\)/projects/page.tsx
git commit -m "feat(projects): add list page"
```

---

## Task 5: プロジェクト作成 + Server Action

**Files:**
- Create: `src/app/(dashboard)/projects/_actions.ts`, `src/app/(dashboard)/projects/new/page.tsx`

- [ ] **Step 1: Server Actions**

`src/app/(dashboard)/projects/_actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateVapidKeys } from "@/lib/vapid";

export type CreateProjectState = { error: string } | undefined;

export async function createProject(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Not authenticated" };

  const { publicKey, privateKey } = generateVapidKeys();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: userData.user.id,
      name,
      vapid_public_key: publicKey,
      vapid_private_key: privateKey,
      vapid_subject: `mailto:${userData.user.email ?? "noreply@nesh.local"}`,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
  revalidatePath("/projects");
  redirect("/projects");
}
```

- [ ] **Step 2: 作成ページ**

`src/app/(dashboard)/projects/new/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject, type CreateProjectState } from "../_actions";

export default function Page() {
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(
    createProject,
    undefined,
  );

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">New project</h1>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={100} autoFocus />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: dev で end-to-end 動作確認**

```bash
pnpm dev > /tmp/nesh-dev.log 2>&1 &
DEV_PID=$!
for i in {1..30}; do
  if curl -sIf http://localhost:3000/sign-up > /dev/null 2>&1; then break; fi
  sleep 1
done

# サインアップ → cookie を保存
COOKIE_JAR=$(mktemp)
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST http://localhost:3000/sign-up \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "email=test+$(date +%s)@example.com" \
  --data-urlencode "password=password123" \
  -o /dev/null -w "sign-up: %{http_code}\n"

# /projects アクセス可能?
curl -s -b "$COOKIE_JAR" -o /dev/null -w "/projects: %{http_code}\n" http://localhost:3000/projects

kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
rm -f "$COOKIE_JAR"
```

注: Server Action は通常 `_action` form encoding ではなく Next.js 内部の RSC payload で動くので、上記 curl は Server Action そのものではなく、cookie ベースで保護ページに到達できるかの確認に過ぎない。完全な E2E は手動ブラウザテストで行うこと(report に手動確認が必要な旨を含める)。

- [ ] **Step 4: lint + format + コミット**

```bash
pnpm format
pnpm lint
git add src/app/\(dashboard\)/projects
git commit -m "feat(projects): add create form with vapid generation"
```

---

## Task 6: プロジェクト詳細(MVP シェル)+ 削除

**Files:**
- Create: `src/app/(dashboard)/projects/[projectId]/page.tsx`
- Create: `src/app/(dashboard)/projects/[projectId]/_components/delete-button.tsx`

- [ ] **Step 1: 詳細ページ**

`src/app/(dashboard)/projects/[projectId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteProjectButton } from "./_components/delete-button";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, vapid_public_key, vapid_subject, created_at")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">ID: </span>
            <code className="text-xs">{project.id}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Created: </span>
            {new Date(project.created_at).toLocaleString()}
          </div>
          <div>
            <span className="text-muted-foreground">VAPID subject: </span>
            <code className="text-xs">{project.vapid_subject}</code>
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        SDK setup info, subscriber count, and notifications will appear here in later phases.
      </p>
    </div>
  );
}
```

注: Next.js 16 では `params` は **Promise**(15 から非同期化済)。`await params` で取り出す。

- [ ] **Step 2: 削除ボタン(クライアント、確認ダイアログ付き)**

`src/app/(dashboard)/projects/[projectId]/_components/delete-button.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteProject } from "../../_actions";

type Props = { projectId: string; projectName: string };

export function DeleteProjectButton({ projectId, projectName }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
        startTransition(async () => {
          try {
            await deleteProject(projectId);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete");
          }
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
```

注: `deleteProject` は最後に `redirect("/projects")` を呼ぶため、成功時はそのまま遷移する。redirect は throw として扱われるが Server Action の境界で正しく処理されるので、上記 try/catch ではエラーのみ捕捉される(redirect は再 throw されて Next.js が処理する)。

- [ ] **Step 3: 動作確認**

```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

エラー 0 を確認。

- [ ] **Step 4: コミット**

```bash
git add src/app/\(dashboard\)/projects/\[projectId\]
git commit -m "feat(projects): add detail page shell with delete"
```

---

## Task 7: 手動 E2E 確認 + HANDOFF 更新

**Files:**
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: 手動ブラウザ確認(チェックリスト)**

`pnpm dev` を起動した状態で `http://localhost:3000` を開き、以下を順に確認:

1. `/` から `/sign-in` にリダイレクト
2. `/sign-up` でメール + パスワード(6 文字以上)を入力 → `/projects` に遷移
3. `/projects` で「No projects yet」が表示
4. 「New project」→ name を入力 → `/projects/<id>` に遷移
5. 詳細で project name / id / created / vapid_subject が表示
6. `/projects` に戻ると作成したカードが見える
7. 別の名前でもう 1 つ作成して 2 つ並ぶことを確認
8. 詳細ページの Delete → 確認ダイアログ → `/projects` に戻り該当が消えている
9. ヘッダの Sign out → `/sign-in` に戻る
10. `/projects` に直接アクセス → `/sign-in` にリダイレクト

エラーや UI の崩れがあれば、該当タスクに戻って修正。

- [ ] **Step 2: HANDOFF.md を更新**

「次のステップ」から「Plan 2: 認証 + プロジェクト CRUD」を完了済みに移し、現状セクションに追記:

- ローカルで sign-up / sign-in / sign-out が動作
- プロジェクト CRUD(list / create / detail / delete)が動作
- VAPID 鍵は作成時に自動生成して DB 保存

- [ ] **Step 3: コミット**

```bash
git add docs/HANDOFF.md
git commit -m "docs: update handoff after auth + projects crud"
```

---

## 完了条件

- [ ] `pnpm lint` がエラー 0
- [ ] `pnpm exec tsc --noEmit` がエラー 0
- [ ] `pnpm dev` 起動時、Task 7 のチェックリスト 10 項目すべてパス
- [ ] DB の `projects` 行に VAPID 公開鍵 / 秘密鍵 / subject が保存されている
  確認:
  ```bash
  PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
    -c "select id, name, vapid_subject, length(vapid_private_key) from public.projects;"
  ```
- [ ] 別ユーザーで作成したプロジェクトが他ユーザーから見えない(RLS が効いている)

これらが揃った時点で Plan 3(購読エンドポイント + SDK セットアップ画面)に進める。
