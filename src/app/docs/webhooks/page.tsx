import { Code, H1, H3, Snippet, Table } from "../_components/primitives";

export const metadata = { title: "Webhooks — Nesh docs" };

export default function Page() {
  return (
    <>
      <H1>Webhooks</H1>
      <p>
        Configure one or more webhook URLs on the project page. Every enabled webhook receives a
        JSON <Code>POST</Code> signed with <Code>HMAC-SHA256</Code> for each event. Failed
        deliveries (5xx / 408 / 429 / network errors) are retried with exponential backoff (30s → 2m
        → 10m → 1h, 5 attempts max). The <Code>X-Nesh-Attempt</Code> header counts the attempt
        number when retried.
      </p>
      <p>
        Each webhook can be filtered to a subset of event types from the project page. The default
        (all checkboxes selected) subscribes the webhook to every event.
      </p>

      <H3>Events</H3>
      <Table
        rows={[
          ["notification.sent", "After a notification finishes sending (dashboard / REST / cron)."],
          [
            "subscription.created",
            "A brand-new endpoint subscribed (re-subscribes do not refire).",
          ],
          [
            "subscription.removed",
            "A subscription was removed — by the client (DELETE) or because the push service returned 404/410.",
          ],
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
        <Code>reason: "client"</Code> means the SDK / dashboard called <Code>DELETE</Code>;{" "}
        <Code>reason: "expired"</Code> means the push service returned 404/410 during a send and
        Nesh dropped the dead subscription automatically.
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

      <H3>Verifying the signature (Node.js)</H3>
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
      <p>
        Always compare bodies as raw bytes (read the request body before parsing JSON). Webhook
        delivery has a 5-second timeout; non-2xx responses are recorded as the last delivery error
        and shown on the dashboard.
      </p>
    </>
  );
}
