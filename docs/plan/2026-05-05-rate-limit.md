# Rate Limit Implementation Plan (Phase 2 P2)

**Goal:** Anonymous で叩ける `/api/v1/projects/<id>` の POST / DELETE に IP ベースのレート制限をかけ、購読者水増しによる DoS / 不正利用を防ぐ。

**Architecture:**
- Postgres の `rate_limits` テーブルに `(key, window_start)` 単位で count を保存(fixed window 1 分)
- key は `<project_id>:<ip>:<action>` 形式 (POST と DELETE で別カウント)
- INSERT ... ON CONFLICT で原子的に increment、count が上限超えなら 429 を返す
- IP は Vercel の `x-forwarded-for` ヘッダから取得 (proxy 経由で来る最初の値)
- 上限: POST `60/min`, DELETE `60/min` (1 ユーザーがブラウザ上で操作する想定の余裕値)
- 古い行のクリーンアップは Cron で 1 日 1 回 (24h より古いものを削除)

**Tech Stack:** Supabase Postgres / Next.js Route Handler / 既存 service-role client

---

## File Structure

### 作成
- `supabase/migrations/<ts>_rate_limit.sql` — rate_limits テーブル + index
- `src/lib/rate-limit.ts` — `checkRateLimit({ key, limit, windowSeconds })` ヘルパー
- `src/lib/get-client-ip.ts` — `getClientIp(request)` ヘルパー (`x-forwarded-for` パース)

### 変更
- `src/app/api/v1/projects/[projectId]/route.ts` — POST / DELETE に `checkRateLimit` を組み込む
- `src/app/api/cron/dispatch/route.ts` — 24h より古い rate_limits 行を削除する処理を追加 (or 別 cron で)
- `vercel.ts` — 必要なら別 cron 追加 (最初は dispatch cron に同居でもOK)

---

## Task 1: migration + helper

### Migration

```sql
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (key, window_start)
);
create index rate_limits_window_idx on public.rate_limits(window_start);

-- service-role 専用なので RLS は有効化するが policy は無し (anon 拒否)
alter table public.rate_limits enable row level security;
```

### Helper (`src/lib/rate-limit.ts`)

```ts
import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
};

export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = params;
  const supabase = createAdminClient();

  // Truncate to window start (fixed window)
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
  const resetAt = new Date(windowStart.getTime() + windowSeconds * 1000);

  // Atomic increment via upsert with count = count + 1
  // Supabase の rpc を使うのが本筋だが、簡易には select+update のレースを許容して upsert する
  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_key: key,
    p_window_start: windowStart.toISOString(),
  });
  if (error) {
    // フェイルオープン: rate limit エラーで本処理を止めない (ロギングのみ)
    console.error("[rate-limit] error", error);
    return { ok: true, limit, remaining: limit, resetAt };
  }

  const count = (data as number | null) ?? 1;
  return {
    ok: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}
```

### Postgres 関数 (atomic increment)

migration 末尾に追加:

```sql
create or replace function public.increment_rate_limit(p_key text, p_window_start timestamptz)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, p_window_start, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into new_count;
  return new_count;
end;
$$;
```

### `src/lib/get-client-ip.ts`

```ts
import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}
```

Verify:
```bash
pnpm exec supabase db reset  # ローカルで適用確認
pnpm format && pnpm lint && pnpm exec tsc --noEmit
```

Commit:
```bash
git add supabase/migrations src/lib/rate-limit.ts src/lib/get-client-ip.ts
git commit -m "feat(rate-limit): add rate_limits table and helper"
```

---

## Task 2: route 統合

`src/app/api/v1/projects/[projectId]/route.ts` の POST / DELETE 冒頭で:

```ts
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";

// ... 既存 imports

const RATE_LIMIT_PER_MIN = 60;

async function enforceRateLimit(request: NextRequest, projectId: string, action: "post" | "delete") {
  const ip = getClientIp(request);
  const result = await checkRateLimit({
    key: `subscriptions:${projectId}:${ip}:${action}`,
    limit: RATE_LIMIT_PER_MIN,
    windowSeconds: 60,
  });
  if (!result.ok) {
    return jsonResponse(
      { error: "Rate limit exceeded" },
      429,
    );
  }
  return null;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;

  const limited = await enforceRateLimit(request, projectId, "post");
  if (limited) return limited;

  // ... 既存処理
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const limited = await enforceRateLimit(request, projectId, "delete");
  if (limited) return limited;
  // ... 既存処理
}
```

`jsonResponse` は既存の corsHeaders 入りヘルパーをそのまま使う。429 でも CORS ヘッダが付くようにする (SDK 側でハンドリングできるよう)。

`Retry-After` ヘッダも付与すると親切:

```ts
return new NextResponse(JSON.stringify({ error: "Rate limit exceeded" }), {
  status: 429,
  headers: {
    ...corsHeaders,
    "Content-Type": "application/json",
    "Retry-After": String(Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
  },
});
```

Verify (local):
```bash
pnpm dev > /tmp/nesh-rl.log 2>&1 &
DEV_PID=$!
# ...wait...

# 60 連続成功 + 1 失敗のスモーク
PROJECT_ID=$(<前の手順でテスト用 project を作る>)
for i in {1..62}; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"endpoint\":\"https://x/$i\",\"keys\":{\"p256dh\":\"k\",\"auth\":\"a\"}}" \
    "http://localhost:3000/api/v1/projects/$PROJECT_ID")
  echo "$i: $CODE"
done | tail -10
# 期待: 60 件 201、その後 429
```

Commit:
```bash
git add src/app/api/v1/projects/\[projectId\]/route.ts
git commit -m "feat(api): apply rate limit to subscriptions endpoint"
```

---

## Task 3: 古い行のクリーンアップ

`src/app/api/cron/dispatch/route.ts` の処理末尾に追加:

```ts
// Cleanup rate_limits older than 24h (no auth needed; same cron secret)
await supabase
  .from("rate_limits")
  .delete()
  .lt("window_start", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
```

メインの dispatch 処理を阻害しないよう try/catch で握り潰す。

Verify:
```bash
# cron を叩いて 200 が返ること、rate_limits に古い行が残らないこと
```

Commit:
```bash
git add src/app/api/cron/dispatch/route.ts
git commit -m "feat(cron): cleanup rate_limits older than 24h"
```

---

## Task 4: 本番 migration push + デプロイ

```bash
pnpm exec supabase db push -p '<DB_PASSWORD>'
```

その後 main にマージ → push → Vercel 自動デプロイ。

E2E 確認 (本番):
- `/api/v1/projects/<test_project>` に 60 回連続 POST → 60 回 201
- 61 回目 → 429 + `Retry-After` ヘッダ

---

## 完了条件

- [ ] migration 適用済 (ローカル + 本番)
- [ ] `pnpm lint` / `tsc --noEmit` 0 エラー
- [ ] ローカルでレート制限が効くこと (60 件成功 + 429)
- [ ] 本番でも同様
- [ ] DELETE も同等に制限
- [ ] cron で古い行の削除が実行される
