import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Code, H1, H3, Snippet } from "../_components/primitives";

export async function generateMetadata() {
  const t = await getTranslations("docs.restApi");
  return { title: t("metaTitle") };
}

export default function Page() {
  const t = useTranslations("docs.restApi");
  return (
    <>
      <H1>{t("title")}</H1>
      <p>
        {t("baseUrlLabel")}: <Code>https://nesh.kkweb.io/api/v1/projects/&lt;projectId&gt;</Code>
      </p>

      <H3>{t("subscribe.title")}</H3>
      <p>{t("subscribe.body")}</p>
      <Snippet
        lang="bash"
        code={`POST /api/v1/projects/<projectId>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": { "p256dh": "...", "auth": "..." },
  "userId": "alice"            // optional
}

→ 201 { "ok": true }`}
      />
      <p>{t("subscribe.note")}</p>

      <H3>{t("unsubscribe.title")}</H3>
      <Snippet
        lang="bash"
        code={`DELETE /api/v1/projects/<projectId>?endpoint=<urlencoded-endpoint>

→ 200 { "ok": true }`}
      />

      <H3>{t("send.title")}</H3>
      <p>
        {t.rich("send.body", {
          bearer: () => <Code>Bearer</Code>,
          key: () => <Code>nesh_sk_…</Code>,
        })}
      </p>
      <Snippet
        lang="bash"
        code={`POST /api/v1/projects/<projectId>/notifications
Authorization: Bearer nesh_sk_…
Content-Type: application/json

{
  "title":   "Hello",
  "body":    "From the API",
  "url":     "https://example.com",
  "icon":    "https://example.com/icon-192.png",
  "image":   "https://example.com/hero.jpg",
  "badge":   "https://example.com/badge-72.png",
  "userIds": ["alice", "bob"]    // optional — omit to broadcast
}

→ 201 {
  "id":        "uuid",
  "attempted": 12,
  "delivered": 11,
  "removed":   1,
  "failed":    0
}`}
      />
      <p>{t.rich("send.note", { code: () => <Code>429</Code> })}</p>

      <H3>{t("track.title")}</H3>
      <p>{t("track.body")}</p>
      <Snippet
        lang="bash"
        code={`POST /api/v1/projects/<projectId>/notifications/<notificationId>/events
Content-Type: application/json

{ "type": "shown" }   // or "clicked"

→ 200 { "ok": true }`}
      />
    </>
  );
}
