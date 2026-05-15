import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Code, H1, H3, Snippet, Table } from "../_components/primitives";

export async function generateMetadata() {
  const t = await getTranslations("docs.webhooks");
  return { title: t("metaTitle") };
}

export default function Page() {
  const t = useTranslations("docs.webhooks");
  return (
    <>
      <H1>{t("title")}</H1>
      <p>
        {t.rich("intro1", {
          post: () => <Code>POST</Code>,
          hmac: () => <Code>HMAC-SHA256</Code>,
          attempt: () => <Code>X-Nesh-Attempt</Code>,
        })}
      </p>
      <p>{t("intro2")}</p>

      <H3>{t("events.title")}</H3>
      <Table
        rows={[
          ["notification.sent", t("events.notificationSent")],
          ["subscription.created", t("events.subscriptionCreated")],
          ["subscription.removed", t("events.subscriptionRemoved")],
        ]}
      />

      <H3>notification.sent</H3>
      <Snippet
        lang="bash"
        code={`POST <your-webhook-url>
Content-Type: application/json
X-Nesh-Event: notification.sent
X-Nesh-Signature: sha256=<hex hmac of body>

{
  "type": "notification.sent",
  "notification": {
    "id":              "uuid",
    "project_id":      "uuid",
    "title":           "Hello",
    "body":            "From Nesh",
    "url":             "https://example.com",
    "delivered":       11,
    "removed":         1,
    "failed":          0,
    "target_user_ids": ["alice"],
    "sent_at":         "2026-05-05T18:00:00.000Z"
  }
}`}
      />

      <H3>subscription.created</H3>
      <Snippet
        lang="bash"
        code={`X-Nesh-Event: subscription.created

{
  "type": "subscription.created",
  "subscription": {
    "id":               "uuid",
    "project_id":       "uuid",
    "endpoint":         "https://fcm.googleapis.com/...",
    "external_user_id": "alice",
    "created_at":       "2026-05-05T18:00:00.000Z"
  }
}`}
      />

      <H3>subscription.removed</H3>
      <p>
        {t.rich("removedReason", {
          client: () => <Code>reason: "client"</Code>,
          expired: () => <Code>reason: "expired"</Code>,
        })}
      </p>
      <Snippet
        lang="bash"
        code={`X-Nesh-Event: subscription.removed

{
  "type": "subscription.removed",
  "subscription": {
    "project_id":       "uuid",
    "endpoint":         "https://fcm.googleapis.com/...",
    "external_user_id": "alice",
    "reason":           "client",
    "removed_at":       "2026-05-05T18:00:00.000Z"
  }
}`}
      />

      <H3>{t("verify.title")}</H3>
      <Snippet
        lang="js"
        code={`import { createHmac, timingSafeEqual } from "node:crypto";

export function verify(body, signatureHeader, secret) {
  const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}`}
      />
      <p>{t("verify.note")}</p>
    </>
  );
}
