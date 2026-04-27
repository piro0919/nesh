# Handoff — 2026-04-27

次回セッションで本プロジェクトを再開するための引き継ぎメモ。

## 現状

- リポジトリ作成済み：[`piro0919/nesh`](https://github.com/piro0919/nesh)（public, MIT）
- ローカル：`/Users/piro/Repository/nesh`
- Next.js 16 (App Router, TypeScript, Tailwind v4, Turbopack, src ディレクトリ, ESLint なし) のスキャフォールド完了
- 設計書：[`docs/spec/2026-04-27-push-saas-mvp-design.md`](./spec/2026-04-27-push-saas-mvp-design.md) に集約済み
- まだ未着手：実装プラン、Supabase 連携、shadcn/ui 導入、Lint（Biome）導入、その他のセットアップ

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

優先順に：

1. **実装プランの作成**（`superpowers:writing-plans` skill を使う）
   - 設計書を入力に、ステップ単位の実装計画を書く
   - 出力先：`docs/plan/2026-04-XX-mvp-implementation.md`（仮）

2. **next-push 0.4 リリース**
   - `usePush` に `apiBase` オプションを追加（SDK が SaaS 側エンドポイントを指せるように）
   - SaaS 側のエンドポイント仕様は `createPushHandler` プロトコルと完全互換にする予定
   - 別リポジトリ（`piro0919/next-push`）での作業

3. **Supabase プロジェクトの作成**
   - DB / Auth / RLS の設定
   - 環境変数を Vercel に登録

4. **マイグレーションと初期 RLS ポリシー作成**
5. **認証フロー実装**（Supabase Auth）
6. **プロジェクト CRUD**
7. **SDK セットアップ画面**（`apiBase` / `publicKey` のコピー UI）
8. **購読登録エンドポイント**（`@piro0919/next-push/server` の `createPushHandler` を使う）
9. **通知作成・送信フロー**（即時 + 予約）
10. **Vercel Cron 設定**（予約送信のディスパッチ）
11. **送信履歴 UI**

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
