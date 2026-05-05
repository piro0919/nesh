# Handoff — 2026-05-05

次回セッションで本プロジェクトを再開するための引き継ぎメモ。

## 現状

- リポジトリ作成済み：[`piro0919/nesh`](https://github.com/piro0919/nesh)（public, MIT）
- ローカル：`/Users/piro/Repository/nesh`
- Next.js 16 (App Router, TypeScript, Tailwind v4, Turbopack, src ディレクトリ) のスキャフォールド完了
- 設計書：[`docs/spec/2026-04-27-push-saas-mvp-design.md`](./spec/2026-04-27-push-saas-mvp-design.md) に集約済み
- 実装プラン Plan 1（基盤）：[`docs/plan/2026-05-05-mvp-foundation.md`](./plan/2026-05-05-mvp-foundation.md) — **完了**（main にマージ済み）
  - Biome（lint + format）導入済み
  - Supabase ローカルスタック構築済み（`pnpm db:start` で起動）
  - 初期マイグレーション適用済み（`projects` / `subscriptions` / `notifications` + RLS）
  - Supabase 型生成・Server / Browser クライアント・`src/proxy.ts`（Next.js 16 の middleware 後継）整備済み
  - shadcn/ui 初期化 + Button コンポーネント追加済み
- 実装プラン Plan 2（認証 + プロジェクト CRUD）：[`docs/plan/2026-05-05-auth-and-projects.md`](./plan/2026-05-05-auth-and-projects.md) — **完了**（`feat/auth-and-projects` ブランチ）
  - Supabase Auth (email + password) によるサインアップ / サインイン / サインアウト動作
  - shadcn/ui 追加: Input / Label / Form / Card / Sonner
  - プロジェクト CRUD: 一覧 / 作成（VAPID 自動生成）/ 詳細シェル / 削除
  - Route Group `(auth)` / `(dashboard)` でガード集約、`/` は認証状態に応じて redirect
  - Programmatic E2E（Supabase REST 経由のサインアップ → insert → select）で RLS が user スコープで効いていることを確認済み
- 未着手：Plan 3 以降（購読エンドポイント、SDK セットアップ画面、通知送信、Cron、履歴 UI）

## ブランド

**Nesh**（`Next + push` の合成語、発音「ネシュ」）

- ドメイン運用：`kkweb.io` のサブドメインを利用予定（例：`nesh.kkweb.io`）
- npm 公開予定なし（SDK は既存の `@piro0919/next-push` を使い回す方針）
- GitHub は `piro0919/nesh`（個人アカウント配下、独立 Org は持たない）

## 設計上の主要決定（詳細は spec を参照）

| 項目 | 決定 |
|---|---|
| ポジショニング | 「OneSignal の Umami」、機能を絞ったシンプルな Web Push SaaS |
| 動機 | 個人運営による小規模収益と、`next-push` の dogfood 場 |
| マルチテナント | User → Project の 1 階層（チーム機能なし） |
| 購読者識別 | 匿名 + `external_user_id`（MVP では DB カラムも UI も持たない、Phase 2 で追加） |
| 送信入口 | MVP はダッシュボード送信のみ（REST API は Phase 2） |
| 予約送信 | ワンショットのみ（cron 的な繰り返しなし） |
| Analytics | MVP ゼロ（Phase 2 で `delivered → shown → clicked` の順に追加） |
| SDK | 新規開発しない。`@piro0919/next-push` に `apiBase` オプションを追加（next-push 0.4 で対応） |
| スタック | Next.js 16 + Supabase (Postgres + Auth + RLS) + Vercel Cron + shadcn/ui + Tailwind |
| データモデル | 3 テーブル（`projects` / `subscriptions` / `notifications`） |

## 次のステップ

Plan 1 の完了を受けて、残りは以下の順で進める想定（Plan 2 以降のプラン書き起こしから着手）:

1. **Plan 3: 購読エンドポイント + SDK セットアップ画面** — `@piro0919/next-push/server` の `createPushHandler` 互換エンドポイント、`apiBase` / `publicKey` コピー UI、購読者数の表示
2. **Plan 4: 通知送信（即時 + 予約 + Cron）+ 履歴 UI** — 通知作成、即時送信、予約送信、Vercel Cron でのディスパッチ、送信履歴一覧
3. **Vercel デプロイ + 本番 Supabase 接続** — 環境変数設定、Cron スケジュール登録
4. **next-push 0.4 リリース** — `usePush` に `apiBase` オプションを追加（別リポジトリ `piro0919/next-push` での作業、Plan 3 の動作確認に必要）

### 手動ブラウザテスト（推奨）

Plan 2 完了時点で以下のフローを `pnpm dev` 起動後にブラウザで一度確認しておくと安心:

1. `/` → `/sign-in` リダイレクト
2. `/sign-up` でアカウント作成 → `/projects` に遷移
3. 「New project」で作成 → `/projects/<id>` に遷移
4. 詳細から削除 → `/projects` に戻り消えている
5. ヘッダの Sign out → `/sign-in` に戻る

## 後回し項目（実利用後に検討）

- Analytics（`delivered` → `shown` → `clicked` の順）
- `external_user_id` 指定送信
- REST API（脇役送信入口）
- ロゴ・LP・競合差別化の打ち出し
- 個人運営リスクへのスタンス（データ持ち出し容易性など）
- VAPID 秘密鍵の列暗号化
- 不正利用対策（レート制限・購読者上限）
- 大規模送信の fan-out 戦略
- チーム機能 / メンバー権限
- 非 React / 素 HTML 向け script タグ SDK
- iOS / Android ネイティブ SDK

## 関連リポジトリ

- [`piro0919/next-push`](https://github.com/piro0919/next-push) — クライアント SDK と送信ライブラリ。Nesh はこれを dogfood する
