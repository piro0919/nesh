import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Code, H1, H3, Snippet, Table } from "../_components/primitives";

export async function generateMetadata() {
  const t = await getTranslations("docs.selfHost");
  return { title: t("metaTitle") };
}

export default function Page() {
  const t = useTranslations("docs.selfHost");

  return (
    <>
      <H1>{t("title")}</H1>
      <p>{t("intro")}</p>

      <H3>{t("reqs.title")}</H3>
      <ul className="ml-5 list-disc space-y-1">
        <li>{t("reqs.node")}</li>
        <li>{t("reqs.pg")}</li>
        <li>{t("reqs.host")}</li>
        <li>{t("reqs.https")}</li>
      </ul>

      <H3>{t("step1.title")}</H3>
      <p>{t("step1.body")}</p>
      <Snippet
        lang="bash"
        code={`git clone https://github.com/piro0919/nesh.git
cd nesh
pnpm install`}
      />

      <H3>{t("step2.title")}</H3>
      <p>{t.rich("step2.bodyLead", { code: () => <Code>supabase/migrations/</Code> })}</p>
      <Snippet lang="bash" code="pnpm db:start" />
      <p>{t.rich("step2.bodyCli", { code: () => <Code>supabase/migrations/</Code> })}</p>
      <p className="text-muted-foreground">{t("step2.rls")}</p>

      <H3>{t("step3.title")}</H3>
      <p>
        {t.rich("step3.body", {
          code: (chunks) => (chunks ? <Code>{chunks}</Code> : <Code>.env.local</Code>),
        })}{" "}
        <Code>.env.example</Code> → <Code>.env.local</Code>.
      </p>
      <Table
        rows={[
          ["NEXT_PUBLIC_SUPABASE_URL", t("env.supabaseUrl")],
          ["NEXT_PUBLIC_SUPABASE_ANON_KEY", t("env.supabaseAnon")],
          ["SUPABASE_SERVICE_ROLE_KEY", t("env.supabaseService")],
          ["NEXT_PUBLIC_SITE_URL", t("env.siteUrl")],
          ["CRON_SECRET", t("env.cronSecret")],
          ["VAPID_KEY_ENCRYPTION_KEY", t("env.vapidKeyEnc")],
          ["ADMIN_USER_IDS", t("env.adminUserIds")],
        ]}
      />
      <Snippet
        lang="bash"
        code={`# Generate VAPID_KEY_ENCRYPTION_KEY
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"

# Generate CRON_SECRET
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"`}
      />

      <H3>{t("step4.title")}</H3>
      <p>{t.rich("step4.vercelLead", { code: () => <Code>vercel.ts</Code> })}</p>
      <p>{t("step4.selfLead")}</p>
      <Snippet
        lang="bash"
        code={`pnpm build
pnpm start  # default :3000`}
      />
      <p className="text-muted-foreground">
        {t.rich("step4.noteCron", { code: () => <Code>/api/cron/dispatch</Code> })}
      </p>

      <H3>{t("step5.title")}</H3>
      <p>{t.rich("step5.body", { code: () => <Code>CRON_SECRET</Code> })}</p>
      <p>{t.rich("step5.vercel", { code: () => <Code>vercel.ts</Code> })}</p>
      <p>{t("step5.manual")}</p>
      <Snippet
        lang="bash"
        code={`* * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \\
  https://your-nesh.example.com/api/cron/dispatch`}
      />

      <H3>{t("step6.title")}</H3>
      <p>{t.rich("step6.body", { code: () => <Code>ADMIN_USER_IDS</Code> })}</p>

      <H3>{t("notes.title")}</H3>
      <ul className="ml-5 list-disc space-y-2">
        <li>{t.rich("notes.encKey", { code: () => <Code>VAPID_KEY_ENCRYPTION_KEY</Code> })}</li>
        <li>{t("notes.scaling")}</li>
        <li>{t("notes.tracking")}</li>
        <li>{t.rich("notes.logs", { code: () => <Code>error_logs</Code> })}</li>
      </ul>
    </>
  );
}
