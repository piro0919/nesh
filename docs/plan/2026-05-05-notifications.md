# Notifications (Send / Schedule / Cron / History) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** プロジェクトの全購読者に Web Push を送る機能(即時/予約)、Vercel Cron 互換のディスパッチエンドポイント、送信履歴の表示と通知の削除/予約キャンセルを実装する。

**Architecture:**
- **送信ロジック:** `web-push` の `sendNotification` で購読者一行ずつ直列送信。404/410 を受けたら該当 `subscriptions` 行を `DELETE`。それ以外のエラーはログのみで続行。
- **即時送信:** Server Action 内で `notifications` 行を `pending` で作成 → 同一トランザクション内で `sendToProject()` を呼ぶ → 成功後 `status='sent'` に更新。MVP の規模では Vercel Function 1 回で全配信して問題なし。
- **予約送信:** Server Action は `notifications` を `pending` + `scheduled_at` で作成して終了。送信は Cron。
- **Cron:** `/api/cron/dispatch` が `Authorization: Bearer <CRON_SECRET>` で認可。`status='pending' AND scheduled_at IS NOT NULL AND scheduled_at <= now()` の行を `for update skip locked` で 1 件ずつ拾って送信 → `status='sent'`。Vercel Cron は毎分(`* * * * *`)で叩く。
- **履歴 UI:** プロジェクト詳細ページに直近 N 件の通知をリスト表示。各行に status / scheduled_at / 削除ボタン。
- **設定ファイル:** Vercel 16 系では `vercel.ts` 推奨だが、Cron 設定は `vercel.json` でも `vercel.ts` でも書ける。本プランでは TypeScript 設定 (`vercel.ts`) を採用。

**Tech Stack:** web-push (送信) / Next.js 16 Route Handler (Cron) / Server Actions (作成 + 削除) / Supabase service-role client / @vercel/config (vercel.ts)

> **重要:** Web Push の VAPID 秘密鍵は MVP では平文 DB 保存(spec の通り)。暗号化は Phase 2 のハードニング。

---

## File Structure

### 作成

- `src/lib/push/send.ts` — `sendToProject(projectId)` (web-push で全購読者に送信、404/410 で subscription 削除)
- `src/lib/push/payload.ts` — 通知ペイロードの型と zod スキーマ
- `src/app/(dashboard)/projects/[projectId]/notifications/_actions.ts` — `createNotification` (immediate/scheduled), `deleteNotification`
- `src/app/(dashboard)/projects/[projectId]/notifications/new/page.tsx` — 通知作成フォーム
- `src/app/(dashboard)/projects/[projectId]/_components/notifications-list.tsx` — 履歴リスト (Server Component)
- `src/app/(dashboard)/projects/[projectId]/_components/delete-notification-button.tsx` — 削除ボタン (Client)
- `src/app/api/cron/dispatch/route.ts` — Vercel Cron ハンドラ
- `vercel.ts` — Cron スケジュール定義

### 変更

- `src/app/(dashboard)/projects/[projectId]/page.tsx` — 「Send notification」ボタンと履歴を追加
- `.env.example` — `CRON_SECRET` を追記
- `.env.local` — 同上 (gitignore 済み)
- `package.json` — `@vercel/config` を dev 依存に追加

---

## Task 1: 送信ヘルパー + payload スキーマ

### Files
Create `src/lib/push/payload.ts`:

```ts
import { z } from "zod";

export const notificationPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  url: z.string().url().optional().nullable(),
});

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
```

Create `src/lib/push/send.ts`:

```ts
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type SendResult = {
  attempted: number;
  sent: number;
  removed: number;
  failed: number;
};

export async function sendToProject(projectId: string, notificationId: string): Promise<SendResult> {
  const supabase = createAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("vapid_public_key, vapid_private_key, vapid_subject")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new Error("Project not found");

  const { data: notification, error: notificationError } = await supabase
    .from("notifications")
    .select("title, body, url")
    .eq("id", notificationId)
    .maybeSingle();
  if (notificationError) throw notificationError;
  if (!notification) throw new Error("Notification not found");

  const { data: subscriptions, error: subsError } = await supabase
    .from("subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("project_id", projectId);
  if (subsError) throw subsError;

  webpush.setVapidDetails(
    project.vapid_subject,
    project.vapid_public_key,
    project.vapid_private_key,
  );

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url ?? undefined,
  });

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const sub of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("subscriptions").delete().eq("id", sub.id);
        removed++;
      } else {
        failed++;
        console.error("[push] send failed", { subscriptionId: sub.id, error });
      }
    }
  }

  return { attempted: subscriptions?.length ?? 0, sent, removed, failed };
}
```

### Verify
```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

### Commit
```bash
git add src/lib/push
git commit -m "feat(push): add sendToProject with 404/410 cleanup"
```

---

## Task 2: 通知 Server Actions (create + delete)

### Files
Create `src/app/(dashboard)/projects/[projectId]/notifications/_actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notificationPayloadSchema } from "@/lib/push/payload";
import { sendToProject } from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";

export type CreateNotificationState = { error: string } | undefined;

export async function createNotification(
  projectId: string,
  _prev: CreateNotificationState,
  formData: FormData,
): Promise<CreateNotificationState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const urlRaw = String(formData.get("url") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduled_at") ?? "").trim();
  const mode = String(formData.get("mode") ?? "immediate"); // "immediate" | "scheduled"

  const parsed = notificationPayloadSchema.safeParse({
    title,
    body,
    url: urlRaw === "" ? null : urlRaw,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  let scheduledAt: string | null = null;
  if (mode === "scheduled") {
    if (!scheduledAtRaw) return { error: "Scheduled time is required" };
    const dt = new Date(scheduledAtRaw);
    if (Number.isNaN(dt.getTime())) return { error: "Invalid scheduled time" };
    if (dt.getTime() <= Date.now()) return { error: "Scheduled time must be in the future" };
    scheduledAt = dt.toISOString();
  }

  const supabase = await createClient();
  // RLS が project ownership を担保 (insert with check via project ownership)
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url ?? null,
      scheduled_at: scheduledAt,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (mode === "immediate") {
    try {
      await sendToProject(projectId, notification.id);
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ status: "sent" })
        .eq("id", notification.id);
      if (updateError) return { error: updateError.message };
    } catch (sendError) {
      return { error: sendError instanceof Error ? sendError.message : "Send failed" };
    }
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function deleteNotification(projectId: string, notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}
```

### Verify
```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

### Commit
```bash
git add src/app/\(dashboard\)/projects/\[projectId\]/notifications/_actions.ts
git commit -m "feat(notifications): add create (immediate/scheduled) and delete actions"
```

---

## Task 3: 通知作成フォーム

### Files
Create `src/app/(dashboard)/projects/[projectId]/notifications/new/page.tsx`:

```tsx
"use client";

import { use, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createNotification,
  type CreateNotificationState,
} from "../_actions";

type Props = { params: Promise<{ projectId: string }> };

export default function Page({ params }: Props) {
  const { projectId } = use(params);
  const [mode, setMode] = useState<"immediate" | "scheduled">("immediate");

  const action = createNotification.bind(null, projectId);
  const [state, formAction, pending] = useActionState<CreateNotificationState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">New notification</h1>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={200} autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          required
          maxLength={1000}
          rows={4}
          className="rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="url">URL (optional)</Label>
        <Input id="url" name="url" type="url" placeholder="https://example.com" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Send</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            value="immediate"
            checked={mode === "immediate"}
            onChange={() => setMode("immediate")}
          />
          Immediately
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            value="scheduled"
            checked={mode === "scheduled"}
            onChange={() => setMode("scheduled")}
          />
          At a specific time
        </label>
      </fieldset>

      {mode === "scheduled" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="scheduled_at">Scheduled at (local time)</Label>
          <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
        </div>
      ) : null}

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : mode === "immediate" ? "Send now" : "Schedule"}
      </Button>
    </form>
  );
}
```

### Verify
```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

### Commit
```bash
git add src/app/\(dashboard\)/projects/\[projectId\]/notifications/new
git commit -m "feat(notifications): add create form with immediate/scheduled modes"
```

---

## Task 4: 履歴リスト + 削除ボタン + 詳細ページ統合

### Files

Create `src/app/(dashboard)/projects/[projectId]/_components/delete-notification-button.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteNotification } from "../notifications/_actions";

type Props = {
  projectId: string;
  notificationId: string;
  status: "pending" | "sent";
};

export function DeleteNotificationButton({ projectId, notificationId, status }: Props) {
  const [pending, startTransition] = useTransition();
  const label = status === "pending" ? "Cancel" : "Delete";
  const confirmMsg = status === "pending"
    ? "Cancel this scheduled notification?"
    : "Delete this notification from history?";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmMsg)) return;
        startTransition(async () => {
          try {
            await deleteNotification(projectId, notificationId);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed");
          }
        });
      }}
    >
      {pending ? "..." : label}
    </Button>
  );
}
```

Create `src/app/(dashboard)/projects/[projectId]/_components/notifications-list.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DeleteNotificationButton } from "./delete-notification-button";

type Props = { projectId: string };

export async function NotificationsList({ projectId }: Props) {
  const supabase = await createClient();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, title, body, url, scheduled_at, status, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    <StatusBadge status={n.status as "pending" | "sent"} scheduled={n.scheduled_at} />
                  </div>
                  <span className="text-xs text-muted-foreground">{n.body}</span>
                  <span className="text-xs text-muted-foreground">
                    {n.scheduled_at
                      ? `Scheduled for ${new Date(n.scheduled_at).toLocaleString()}`
                      : `Sent ${new Date(n.created_at).toLocaleString()}`}
                  </span>
                </div>
                <DeleteNotificationButton
                  projectId={projectId}
                  notificationId={n.id}
                  status={n.status as "pending" | "sent"}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, scheduled }: { status: "pending" | "sent"; scheduled: string | null }) {
  const tone =
    status === "sent"
      ? "bg-green-100 text-green-800"
      : scheduled
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800";
  const label = status === "sent" ? "sent" : scheduled ? "scheduled" : "pending";
  return <span className={`rounded px-2 py-0.5 text-xs ${tone}`}>{label}</span>;
}
```

Modify `src/app/(dashboard)/projects/[projectId]/page.tsx` — add a「Send notification」リンクと `<NotificationsList>` を表示。`SdkSetup` の下、最後の placeholder 段落を削除して履歴を表示する。

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { DeleteProjectButton } from "./_components/delete-button";
import { NotificationsList } from "./_components/notifications-list";
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
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/projects/${project.id}/notifications/new`}>Send notification</Link>
          </Button>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
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
      <NotificationsList projectId={project.id} />
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

### Verify
```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

### Commit
```bash
git add src/app/\(dashboard\)/projects/\[projectId\]
git commit -m "feat(notifications): add history list with cancel/delete on detail page"
```

---

## Task 5: Cron エンドポイント + vercel.ts

### Files

Create `src/app/api/cron/dispatch/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { sendToProject } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("notifications")
    .select("id, project_id")
    .eq("status", "pending")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", nowIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ id: string; status: "sent" | "failed"; error?: string }> = [];

  for (const row of due ?? []) {
    try {
      await sendToProject(row.project_id, row.id);
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ status: "sent" })
        .eq("id", row.id);
      if (updateError) throw updateError;
      results.push({ id: row.id, status: "sent" });
    } catch (sendError) {
      results.push({
        id: row.id,
        status: "failed",
        error: sendError instanceof Error ? sendError.message : "unknown",
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

// Vercel Cron は GET でも叩かれる場合がある → 同じ実装にディスパッチ
export const GET = POST;
```

注: Vercel Cron は GET で叩く設計が標準。POST にも対応しておくとローカル curl でテストしやすい。

Create `vercel.ts` (project root):

```ts
import { type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [{ path: "/api/cron/dispatch", schedule: "* * * * *" }],
};

export default config;
```

Add `@vercel/config` to dev deps:

```bash
pnpm add -D @vercel/config
```

If `@vercel/config` is not yet released or unavailable on npm, fall back to `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/dispatch", "schedule": "* * * * *" }]
}
```

Document which form was used in the report.

Modify `.env.example` — append:

```
# Cron secret (set to a strong random string in prod; any non-empty value locally)
CRON_SECRET=local-dev-secret
```

Add the same line to `.env.local`.

### Verify

```bash
pnpm format
pnpm lint
pnpm exec tsc --noEmit
```

dev サーバ + curl で:

```bash
pnpm dev > /tmp/nesh-dev.log 2>&1 &
DEV_PID=$!
for i in {1..40}; do curl -sf http://localhost:3000/sign-in > /dev/null 2>&1 && break; sleep 1; done

# 認可なし → 401
echo "=== unauthorized ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/cron/dispatch

# 正しい secret → 200 + processed:0
echo "=== authorized (no due) ==="
SECRET=$(grep '^CRON_SECRET=' .env.local | cut -d= -f2)
curl -s -X POST -H "Authorization: Bearer $SECRET" \
  http://localhost:3000/api/cron/dispatch

kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

期待: 401 + 200 with `{"processed":0,"results":[]}`。

### Commit

```bash
git add src/app/api/cron vercel.ts package.json pnpm-lock.yaml .env.example
# vercel.json で代替した場合は vercel.json を add
git commit -m "feat(cron): add dispatch endpoint with bearer auth and vercel cron config"
```

---

## Task 6: E2E + HANDOFF + マージ

### Step 1: 即時送信の E2E

ローカル Supabase + dev サーバで:
1. テストユーザー / プロジェクトを admin で作成
2. fake な subscription を 1 つ insert (web-push の送信は `httpbin.org/anything` 等を endpoint にしても VAPID 認証で 失敗するので、web-push が呼ばれて失敗 → status code 由来の挙動を観察。404/410 でなければ failed としてカウントされ、subscription は削除されない)
3. `/api/cron/dispatch` を叩いて処理 0 件を確認(scheduled_at がないため拾われない)
4. 過去日時で予約した notification を直接 insert → cron 叩く → status='sent' に更新されるか確認

実際のブラウザ Push を local で完全動作させるのは複雑なので、本タスクの自動 E2E は「Cron が pending を拾って sent に更新する」までで OK。完全な end-to-end は手動ブラウザで `@piro0919/next-push` 0.4 とつなぎ込んで実施(将来)。

```bash
pnpm dev > /tmp/nesh-dev.log 2>&1 &
DEV_PID=$!
for i in {1..40}; do curl -sf http://localhost:3000/sign-in > /dev/null 2>&1 && break; sleep 1; done

USER_ID=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tA -c "insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role) values (gen_random_uuid(), 'cron-test@nesh.test', '', now(), now(), now(), 'authenticated', 'authenticated') returning id;" | head -1)

PROJECT_ID=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tA -c "insert into public.projects (user_id, name, vapid_public_key, vapid_private_key, vapid_subject) values ('$USER_ID', 'cron-test', 'BNbpb9-0vgN0uQXjjP4fM0gFhJMxjIJk5-7vxz2W2dKnT5jR0VS5xv5_YouR_Test_Public_Key_Bytes', 'realPriv', 'mailto:cron-test@nesh.test') returning id;" | head -1)
echo "project: $PROJECT_ID"

# 過去日時の予約 notification を直接 insert (購読者 0 なら送信ループ即終了して sent に更新される)
NOTIF_ID=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tA -c "insert into public.notifications (project_id, title, body, scheduled_at, status) values ('$PROJECT_ID', 'cron test', 'hello', now() - interval '1 minute', 'pending') returning id;" | head -1)
echo "notification: $NOTIF_ID"

SECRET=$(grep '^CRON_SECRET=' .env.local | cut -d= -f2)
curl -s -X POST -H "Authorization: Bearer $SECRET" \
  http://localhost:3000/api/cron/dispatch

echo "Status after cron:"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tAc \
  "select status from public.notifications where id = '$NOTIF_ID';"

# クリーンアップ
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c \
  "delete from auth.users where email='cron-test@nesh.test';" > /dev/null 2>&1

kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

期待: cron 応答 `{"processed":1,"results":[{"id":"...","status":"sent"}]}`、status 列が `sent` に。

### Step 2: HANDOFF 更新

「現状」に Plan 4 完了を追記し、「次のステップ」から Plan 4 を削除。

### Step 3: コミット + マージ

```bash
git add docs/HANDOFF.md
git commit -m "docs: update handoff after notifications and cron"
```

(controller が main にマージ)

---

## 完了条件

- [ ] `pnpm lint` / `tsc --noEmit` ともにエラー 0
- [ ] 通知作成フォームが immediate / scheduled の両モードで動く
- [ ] 即時送信時、購読者 0 でも notification が作成され、status が即 `sent` になる
- [ ] 予約送信時、`scheduled_at` 列が DB に書き込まれ、status は `pending`
- [ ] `/api/cron/dispatch` が認可なしで 401、正しい Bearer で 200
- [ ] 過去日時の pending を Cron が拾って sent に更新
- [ ] 履歴 UI に通知が表示され、pending は Cancel、sent は Delete で削除できる
- [ ] (本番運用は別タスク) Vercel デプロイ後、Cron が毎分動くこと

完了後、Plan 全体としては Vercel デプロイ + next-push 0.4 とのつなぎ込みが残る。
