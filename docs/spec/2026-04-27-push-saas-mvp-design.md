# Push SaaS MVP — Design

**Date:** 2026-04-27
**Status:** Approved (design phase)
**Working title:** TBD（命名は別フェーズ）

## ポジショニング

「OneSignal の Umami」。機能を絞ったシンプルな Web Push SaaS。作者個人による小規模運営前提、OneSignal の機能過多・UI の重さに不満を持つ層を拾い、`@piro0919/next-push` を dogfood する場として運営する。

### 差別化軸

1. シンプル（機能を削る、覚えることが少ない）
2. 簡単（サインアップ → SDK → 送信が分単位）
3. OSS（MIT、コードが見える、self-host も技術的に可能）

### 動機

- 作者個人による小規模運営。大規模成長や VC マネーは目標外
- 個人運営可能な規模の収益と、`next-push` を dogfood する場の確保

### ターゲットユーザー

- 個人開発者・小規模サービス運営者
- ブログ / メディア / コミュニティ運営者
- 「OneSignal は試したが大げさすぎた」層
- 既存の `@piro0919/next-push` ユーザー（乗り換え障壁ゼロ）

### MVP で切る項目

| 項目 | 取り扱い |
|---|---|
| 高度な segmentation / A/B / journey | 未定 |
| `delivered` / `shown` / `clicked` / CTR の analytics | Phase 2（`delivered → shown → clicked` の順） |
| `external_user_id` 指定送信 UI | Phase 2（DB カラムも MVP では持たない） |
| REST API（脇役送信） | Phase 2 |
| チーム機能 / メンバー権限 | 未定 |
| 非 React / 素 HTML 向け script タグ SDK | 未定 |
| iOS / Android ネイティブ SDK | 未定 |

## 技術スタック

- **Next.js 16 App Router**（dashboard と最小バックエンドを同居）
- **Supabase**（Postgres + Auth + RLS）
- **`@supabase/ssr` + `supabase-js`**（クエリと認証）
- **`supabase gen types typescript`**（型は自動生成）
- **Supabase CLI**（マイグレーション管理）
- **Vercel Cron** + Vercel Functions（予約送信のディスパッチ）
- **shadcn/ui + Tailwind**
- **`@piro0919/next-push/server`**（送信ロジック、dogfood）

## アーキテクチャ概要

### マルチテナント構造

`User → Project` の 1 階層。チーム / Org / メンバー権限なし。`auth.users.id` がそのまま `projects.user_id` に紐付く。

### 購読登録の経路

利用者のサイトに組み込まれた `@piro0919/next-push` がブラウザの push subscription を取得し、SaaS のエンドポイントに登録する。`apiBase` をプロジェクトごとに発行される URL（projectId をパスに含む）に差し替えるだけで動作する。

### 送信フロー

- **即時送信**：ダッシュボードで送信 → `notifications` レコード作成 → 同期的に Vercel Function 上で全購読者に送信 → `status='sent'`
- **予約送信**：ダッシュボードで時刻を指定 → `notifications` レコード作成（`scheduled_at` 設定）→ Vercel Cron が毎分 `pending AND scheduled_at <= now()` を拾って送信 → `status='sent'`
- **404/410（gone）受信時**：該当 `subscription` レコードを DELETE

### 送信スケール

MVP の想定規模では、Vercel Function 1 回で全購読者に直列送信して問題ない。fan-out 戦略（Vercel Queues 等）は実利用後の必要性を見て検討。

## データモデル

`auth.users` は Supabase 管理。MVP で新規に作るのは以下 3 テーブル。

### `projects`

| 列 | 型 | 備考 |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk → `auth.users.id` | RLS で `user_id = auth.uid()` |
| `name` | text | プロジェクト名 |
| `vapid_public_key` | text | クライアントに公開 |
| `vapid_private_key` | text | サーバー保管。MVP は平文、暗号化は Phase 2 ハードニング |
| `vapid_subject` | text | `mailto:...` |
| `created_at` | timestamptz | |

### `subscriptions`

| 列 | 型 | 備考 |
|---|---|---|
| `id` | uuid pk | |
| `project_id` | uuid fk | |
| `endpoint` | text | unique with `project_id` |
| `p256dh` | text | |
| `auth` | text | |
| `created_at` | timestamptz | |

unique 制約：`(project_id, endpoint)`。404/410 受信時は DELETE。

### `notifications`

| 列 | 型 | 備考 |
|---|---|---|
| `id` | uuid pk | |
| `project_id` | uuid fk | |
| `title` | text | |
| `body` | text | |
| `url` | text | nullable |
| `scheduled_at` | timestamptz | nullable = 即時送信 |
| `status` | text | `pending` or `sent` |
| `created_at` | timestamptz | |

### 主要インデックス

- `subscriptions(project_id)` — 「プロジェクトの全員に送る」高速化
- `subscriptions(endpoint)` — upsert / 重複検出
- `notifications(project_id, status, scheduled_at)` — Vercel Cron のポーリング高速化

### RLS 方針

- `projects`：`user_id = auth.uid()` のみ参照・更新可能
- `subscriptions` / `notifications`：`project_id` の所有者のみ
- `subscriptions` の **insert** だけは公開アクセス可（SDK が anon key で叩く）。projectId の存在検証はサーバー側ハンドラで行う

## SDK 統合

クライアント SDK は新規開発しない。既存の `@piro0919/next-push` の `usePush` に `apiBase` オプションを追加し、SaaS のエンドポイントを指せるようにする（`next-push` 0.4 で対応）。

```tsx
'use client';
import { usePush } from '@piro0919/next-push';

const { subscribe } = usePush({
  apiBase: 'https://api.example.com/v1/projects/proj_xxx',
  publicKey: '...VAPID public key...',
});
```

SaaS 側のエンドポイント仕様は `@piro0919/next-push` の `createPushHandler` プロトコルと完全互換にする：

- `POST {apiBase}` — `{endpoint, keys: {p256dh, auth}}` を受け取り subscription を保存
- `DELETE {apiBase}?endpoint=...` — 該当 subscription を削除

これにより SaaS 利用者は自前バックエンドへ戻すときも `apiBase` を 1 行差し替えるだけで完了する。

## ダッシュボード MVP 画面

- サインアップ / サインイン
- プロジェクト一覧
- プロジェクト作成（VAPID 自動生成）
- プロジェクト詳細
  - SDK セットアップ情報の表示（`apiBase`, `publicKey` のコピー）
  - 購読者数の表示
  - 通知作成（タイトル、本文、URL）
  - 送信モード選択（即時 / 予約）
  - 送信履歴一覧
  - 通知の削除（予約のキャンセル含む）

## 後フェーズへの送り

以下は MVP では扱わず、実利用後の優先度で順次検討：

- Analytics（`delivered` → `shown` → `clicked` の順）
- `external_user_id` 指定送信
- REST API（脇役送信入口）
- ブランド名・ロゴ・LP
- 競合差別化の打ち出し（日本語 / Next.js 専門 / OSS など）
- 個人運営リスクへのスタンス（データ持ち出し容易性）
- VAPID 秘密鍵の列暗号化
- 不正利用対策（レート制限・購読者上限）
- 大規模送信の fan-out 戦略
