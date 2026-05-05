# Subscription Endpoint + SDK Setup UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SaaS 利用者のサイトに組み込まれた `@piro0919/next-push` (将来の 0.4) が叩く購読登録 / 解除エンドポイントを実装し、ダッシュボードのプロジェクト詳細に SDK セットアップ情報 (apiBase / publicKey のコピー UI) と購読者数を表示する。

**Architecture:**
- **エンドポイント形式:** `apiBase = /api/v1/projects/<projectId>` とし、同じ URL に対して POST = 購読登録 / DELETE = 購読解除。`@piro0919/next-push` の `createPushHandler` プロトコルと完全互換。
  - `POST /api/v1/projects/<projectId>` body: `{ endpoint: string, keys: { p256dh: string, auth: string } }` → `subscriptions` に upsert
  - `DELETE /api/v1/projects/<projectId>?endpoint=<encoded>` → 該当 subscription を削除
- **クロスオリジン:** SDK は別ドメインから叩くので CORS を許可。MVP では origin チェックは緩め(任意のオリジン許可)、レート制限は Phase 2。
- **認可:** anon キーでは SDK のために INSERT のみ許可済み(Plan 1 の RLS)。サーバー側エンドポイントでは安全のために service role クライアントを使い、projectId の存在検証を明示的に行う。
- **SDK セットアップ UI:** プロジェクト詳細に `apiBase` と `publicKey` を表示するクライアントコンポーネント。クリップボードにコピーボタン (sonner toast)。
- **購読者数:** `head: true, count: 'exact'` でカウントだけ取得して詳細に表示。

**Tech Stack:** Next.js 16 Route Handler / Supabase service-role client / shadcn/ui (既存 Card / Button / Sonner) / Web Clipboard API

> **重要(Next.js 16):** Route Handler の `params` は **Promise**。`await params` で取り出す。

---

## File Structure

### 作成

- `src/lib/supabase/admin.ts` — service role を使う Supabase クライアント (RLS bypass 用)
- `src/lib/subscription-schema.ts` — POST body の zod スキーマ
- `src/app/api/v1/projects/[projectId]/route.ts` — POST / DELETE / OPTIONS ハンドラ
- `src/lib/site-url.ts` — `getSiteUrl()` ヘルパー (apiBase の URL 構築用)
- `src/app/(dashboard)/projects/[projectId]/_components/sdk-setup.tsx` — apiBase / publicKey 表示 + コピー UI
- `src/app/(dashboard)/projects/[projectId]/_components/copy-button.tsx` — クリップボードコピーボタン (sonner toast)

### 変更

- `src/app/(dashboard)/projects/[projectId]/page.tsx` — `<SdkSetup>` を追加、購読者数を表示
- `src/app/(dashboard)/projects/page.tsx` — 一覧カードに購読者数を表示
- `.env.example` — `NEXT_PUBLIC_SITE_URL` を追記
- `.env.local` — 同上 (gitignore 済み、コミット対象外)

---

## Task 1: Service-role Supabase client + site URL helper

**Files:**
- Create: `src/lib/supabase/admin.ts`, `src/lib/site-url.ts`
- Modify: `.env.example`

### Step 1: admin client

`src/lib/supabase/admin.ts`:

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
```

### Step 2: site URL helper

`src/lib/site-url.ts`:

```ts
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
```

### Step 3: env.example に追記

`.env.example` の Supabase ブロックの下に追加:

```
# Public origin of this app (used for apiBase shown in dashboard)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` にも同じ行を追加すること(コミット対象外)。

### Step 4: lint / typecheck

```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

### Step 5: コミット

```bash
git add src/lib/supabase/admin.ts src/lib/site-url.ts .env.example
git commit -m "feat: add service-role supabase client and site-url helper"
```

---

## Task 2: 購読 POST / DELETE エンドポイント

**Files:**
- Create: `src/lib/subscription-schema.ts`
- Create: `src/app/api/v1/projects/[projectId]/route.ts`

### Step 1: zod スキーマ

`src/lib/subscription-schema.ts`:

```ts
import { z } from "zod";

export const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type SubscriptionPayload = z.infer<typeof subscriptionSchema>;
```

### Step 2: Route handler

`src/app/api/v1/projects/[projectId]/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscriptionSchema } from "@/lib/subscription-schema";

type Params = { params: Promise<{ projectId: string }> };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const parsed = subscriptionSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", issues: parsed.error.issues }, 400);
  }

  const supabase = createAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) return jsonResponse({ error: projectError.message }, 500);
  if (!project) return jsonResponse({ error: "Project not found" }, 404);

  const { endpoint, keys } = parsed.data;

  const { error: upsertError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        project_id: projectId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: "project_id,endpoint" },
    );

  if (upsertError) return jsonResponse({ error: upsertError.message }, 500);

  return jsonResponse({ ok: true }, 201);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const endpoint = request.nextUrl.searchParams.get("endpoint");

  if (!endpoint) {
    return jsonResponse({ error: "Missing endpoint query param" }, 400);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("project_id", projectId)
    .eq("endpoint", endpoint);

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ ok: true }, 200);
}
```

### Step 3: 動作確認(programmatic)

`pnpm dev` をバックグラウンドで起動した状態で:

```bash
pnpm dev > /tmp/nesh-dev.log 2>&1 &
DEV_PID=$!
for i in {1..30}; do
  curl -sf http://localhost:3000/sign-in > /dev/null 2>&1 && break
  sleep 1
done

# テスト用プロジェクトを admin で直接作成
PROJECT_ID=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tA <<SQL
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
values (gen_random_uuid(), 'sub-test@nesh.test', '', now(), now(), now(), 'authenticated', 'authenticated')
returning id;
SQL
)
USER_ID="$PROJECT_ID"
PROJECT_ID=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tA <<SQL
insert into public.projects (user_id, name, vapid_public_key, vapid_private_key, vapid_subject)
values ('$USER_ID', 'sub-endpoint-test', 'pk', 'sk', 'mailto:test@nesh.test')
returning id;
SQL
)
echo "test project: $PROJECT_ID"

# OPTIONS preflight
echo "=== OPTIONS ==="
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS \
  "http://localhost:3000/api/v1/projects/$PROJECT_ID"

# POST 正常系
echo "=== POST valid ==="
curl -s -w "\nstatus=%{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"https://fcm.googleapis.com/test/abc","keys":{"p256dh":"pp","auth":"aa"}}' \
  "http://localhost:3000/api/v1/projects/$PROJECT_ID"

# POST 重複(upsert で 201 のはず)
echo "=== POST duplicate ==="
curl -s -w "\nstatus=%{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"https://fcm.googleapis.com/test/abc","keys":{"p256dh":"pp2","auth":"aa2"}}' \
  "http://localhost:3000/api/v1/projects/$PROJECT_ID"

# POST 存在しない project
echo "=== POST unknown project ==="
curl -s -w "\nstatus=%{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"https://x","keys":{"p256dh":"a","auth":"b"}}' \
  "http://localhost:3000/api/v1/projects/00000000-0000-0000-0000-000000000000"

# POST 不正 body
echo "=== POST bad body ==="
curl -s -w "\nstatus=%{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"not-a-url"}' \
  "http://localhost:3000/api/v1/projects/$PROJECT_ID"

# DELETE
echo "=== DELETE ==="
curl -s -w "\nstatus=%{http_code}\n" -X DELETE \
  "http://localhost:3000/api/v1/projects/$PROJECT_ID?endpoint=https%3A%2F%2Ffcm.googleapis.com%2Ftest%2Fabc"

# 行が消えていることを確認
echo "=== rows after delete ==="
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c \
  "select count(*) from public.subscriptions where project_id = '$PROJECT_ID';"

# クリーンアップ
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c \
  "delete from auth.users where email = 'sub-test@nesh.test';" > /dev/null 2>&1

kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

期待:
- OPTIONS: 204
- POST valid: 201
- POST duplicate (upsert): 201 (エラーにならない)
- POST unknown project: 404
- POST bad body: 400
- DELETE: 200
- delete 後の count: 0

### Step 4: lint / typecheck

```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

### Step 5: コミット

```bash
git add src/lib/subscription-schema.ts src/app/api
git commit -m "feat(api): add subscription post/delete endpoint with cors"
```

---

## Task 3: SDK セットアップ情報の表示 + コピー UI

**Files:**
- Create: `src/app/(dashboard)/projects/[projectId]/_components/copy-button.tsx`
- Create: `src/app/(dashboard)/projects/[projectId]/_components/sdk-setup.tsx`
- Modify: `src/app/(dashboard)/projects/[projectId]/page.tsx`

### Step 1: コピーボタン

`src/app/(dashboard)/projects/[projectId]/_components/copy-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = { value: string; label: string };

export function CopyButton({ value, label }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`${label} copied`);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Failed to copy");
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
```

### Step 2: SDK セットアップカード

`src/app/(dashboard)/projects/[projectId]/_components/sdk-setup.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "./copy-button";

type Props = {
  apiBase: string;
  publicKey: string;
};

export function SdkSetup({ apiBase, publicKey }: Props) {
  const usage = `import { usePush } from "@piro0919/next-push";

const { subscribe } = usePush({
  apiBase: "${apiBase}",
  publicKey: "${publicKey}",
});`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SDK setup</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <Field label="apiBase" value={apiBase} />
        <Field label="publicKey" value={publicKey} mono />
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Example</span>
            <CopyButton value={usage} label="Snippet" />
          </div>
          <pre className="overflow-x-auto rounded border bg-muted p-3 text-xs">
            <code>{usage}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <CopyButton value={value} label={label} />
      </div>
      <code className={mono ? "break-all text-xs" : "break-all text-sm"}>{value}</code>
    </div>
  );
}
```

### Step 3: 詳細ページに組み込む

`src/app/(dashboard)/projects/[projectId]/page.tsx` を以下に置換:

```tsx
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { DeleteProjectButton } from "./_components/delete-button";
import { SdkSetup } from "./_components/sdk-setup";

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

  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { head: true, count: "exact" })
    .eq("project_id", project.id);

  const apiBase = `${getSiteUrl()}/api/v1/projects/${project.id}`;

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
          <Row label="ID" value={project.id} mono />
          <Row label="Created" value={new Date(project.created_at).toLocaleString()} />
          <Row label="VAPID subject" value={project.vapid_subject} mono />
          <Row label="Subscribers" value={String(subscriberCount ?? 0)} />
        </CardContent>
      </Card>
      <SdkSetup apiBase={apiBase} publicKey={project.vapid_public_key} />
      <p className="text-sm text-muted-foreground">
        Notification creation and history will appear here in the next phase.
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      {mono ? <code className="text-xs">{value}</code> : <span>{value}</span>}
    </div>
  );
}
```

### Step 4: 動作確認

```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

すべてエラー 0。

### Step 5: コミット

```bash
git add src/app/\(dashboard\)/projects/\[projectId\]
git commit -m "feat(projects): show sdk setup info and subscriber count on detail page"
```

---

## Task 4: 一覧カードに購読者数を表示

**Files:**
- Modify: `src/app/(dashboard)/projects/page.tsx`

### Step 1: 一覧クエリに count を含める

Supabase JS では同一クエリで親と子の count を取るのが少し冗長なので、各行ごとに別クエリは打たずに次のテクニックを使う:

```ts
.select("id, name, created_at, subscriptions(count)")
```

これで `project.subscriptions[0].count` のように取得できる(supabase-js v2 の仕様)。型は database.types.ts に従って `subscriptions` がリレーションとして含まれる。

`src/app/(dashboard)/projects/page.tsx` を以下に置換:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, created_at, subscriptions(count)")
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
          {projects.map((p) => {
            const count = p.subscriptions[0]?.count ?? 0;
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="block">
                  <Card className="transition hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>{p.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created {new Date(p.created_at).toLocaleString()}</span>
                      <span>{count} subscribers</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

### Step 2: 動作確認

```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

`subscriptions(count)` の型が `Database` 型から正しく推論できることを `tsc` で確認。エラーが出たら型キャストではなく `count` フィールドを安全に取り出す形 (`Array.isArray(p.subscriptions) ? ...` など) に調整する。

dev で /projects が描画されることも軽く確認:

```bash
pnpm dev > /tmp/nesh-dev.log 2>&1 &
DEV_PID=$!
for i in {1..30}; do
  curl -sf http://localhost:3000/sign-in > /dev/null 2>&1 && break
  sleep 1
done
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/projects
grep -iE "error|exception" /tmp/nesh-dev.log | grep -v favicon | head
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

期待: 307 (未認証で sign-in に redirect)。エラーログなし。

### Step 3: コミット

```bash
git add src/app/\(dashboard\)/projects/page.tsx
git commit -m "feat(projects): show subscriber count on list page"
```

---

## Task 5: HANDOFF 更新 + マージ

**Files:**
- Modify: `docs/HANDOFF.md`

### Step 1: HANDOFF の現状セクションに Plan 3 完了を追記

「現状」に追記:

```
- 実装プラン Plan 3（購読エンドポイント + SDK セットアップ UI）：[`docs/plan/2026-05-05-subscription-endpoint.md`](./plan/2026-05-05-subscription-endpoint.md) — **完了**
  - `POST /api/v1/projects/<id>` で購読登録、`DELETE /api/v1/projects/<id>?endpoint=...` で解除（CORS 許可済）
  - プロジェクト詳細に SDK セットアップ情報（apiBase / publicKey / 使用例）と購読者数を表示
  - プロジェクト一覧カードにも購読者数を表示
```

「次のステップ」から Plan 3 を削除し、Plan 4 を 1 番目に移す。

### Step 2: コミット

```bash
git add docs/HANDOFF.md
git commit -m "docs: update handoff after subscription endpoint and sdk ui"
```

### Step 3: main にマージ

(controller が手動で実施)

---

## 完了条件

- [ ] `pnpm lint` 0 エラー / `pnpm exec tsc --noEmit` 0 エラー
- [ ] Task 2 の curl テストすべて期待通り
- [ ] OPTIONS が CORS ヘッダ付き 204 を返す
- [ ] POST 正常系で `subscriptions` 行が作成される
- [ ] POST 重複で 201 (upsert で更新)
- [ ] POST 不正 body で 400
- [ ] POST 未知 projectId で 404
- [ ] DELETE で行が消える
- [ ] プロジェクト詳細に apiBase / publicKey / 購読者数が表示される
- [ ] プロジェクト一覧カードに購読者数が表示される

完了後、Plan 4(通知作成 + 即時/予約送信 + Cron + 履歴 UI)に進める。
