import { Code, H1, H3, Snippet } from "../_components/primitives";

export const metadata = { title: "REST API — Nesh docs" };

export default function Page() {
  return (
    <>
      <H1>REST API</H1>
      <p>
        Base URL: <Code>https://nesh.kkweb.io/api/v1/projects/&lt;projectId&gt;</Code>
      </p>

      <H3>Subscribe</H3>
      <p>Called by the SDK after the browser issues a push subscription. CORS-enabled, no auth.</p>
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
      <p>
        Rate limited 60 / minute per IP × project × action. The endpoint also enforces the free-tier
        subscriber cap on new endpoints (existing endpoints can always update).
      </p>

      <H3>Unsubscribe</H3>
      <Snippet
        lang="bash"
        code={`DELETE /api/v1/projects/<projectId>?endpoint=<urlencoded-endpoint>

→ 200 { "ok": true }`}
      />

      <H3>Send notification</H3>
      <p>
        Server-to-server. Use the <Code>Bearer</Code> token from the project's API key card (format{" "}
        <Code>nesh_sk_…</Code>). Synchronous — the response includes delivery counts.
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
      <p>
        Subject to the monthly send cap (10,000 / project / UTC month on the free tier). Returns{" "}
        <Code>429</Code> when reached.
      </p>

      <H3>Track event (SDK / SW)</H3>
      <p>
        Service Workers POST shown / clicked beacons here automatically when the SDK is v0.6+. You
        shouldn't normally call this from your code.
      </p>
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
