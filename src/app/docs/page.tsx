import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Docs — Nesh",
  description: "REST API, SDK, and webhook reference for Nesh.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            Nesh
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <article className="prose prose-neutral dark:prose-invert flex flex-col gap-12 text-sm">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
            <p className="text-base text-muted-foreground">
              Everything you need to integrate Nesh: SDK quick start, REST API reference, and
              webhook signing.
            </p>
            <nav className="flex flex-wrap gap-3 text-xs">
              <a className="underline-offset-2 hover:underline" href="#quick-start">
                Quick start
              </a>
              <a className="underline-offset-2 hover:underline" href="#sdk">
                SDK reference
              </a>
              <a className="underline-offset-2 hover:underline" href="#rest-api">
                REST API
              </a>
              <a className="underline-offset-2 hover:underline" href="#webhooks">
                Webhooks
              </a>
              <a className="underline-offset-2 hover:underline" href="#limits">
                Free-tier limits
              </a>
            </nav>
          </header>

          <Section id="quick-start" title="Quick start">
            <Ol>
              <li>
                <strong>Sign up</strong> at <Code>/sign-up</Code> and create a project. We generate
                a VAPID key pair for you and assign a per-project API key.
              </li>
              <li>
                Install the SDK in your Next.js / React app:
                <Snippet code={`pnpm add @piro0919/next-push`} lang="bash" />
              </li>
              <li>
                Drop in the <Code>usePush</Code> hook with the values from your project's "SDK
                setup" card:
                <Snippet
                  code={`'use client';
import { usePush } from "@piro0919/next-push";

export function Subscribe() {
  const { subscribe } = usePush({
    apiBase: "https://nesh.kkweb.io/api/v1/projects/<projectId>",
    vapidPublicKey: "<VAPID public key>",
    // Optional — scope subscriptions to your application's user id
    // so you can target sends by user from the dashboard / REST API.
    userId: currentUser.id,
  });
  return <button onClick={subscribe}>Enable notifications</button>;
}`}
                  lang="tsx"
                />
              </li>
              <li>
                Add a service worker at <Code>public/sw.js</Code>. The default handlers shipped with{" "}
                <Code>@piro0919/next-push/sw</Code> render notifications and fire shown / click
                tracking automatically:
                <Snippet
                  code={`import { handlePush, handleClick } from "@piro0919/next-push/sw";

self.addEventListener("push", (event) => handlePush(event));
self.addEventListener("notificationclick", (event) => handleClick(event));`}
                  lang="js"
                />
              </li>
              <li>Send your first notification from the dashboard, or via the REST API below.</li>
            </Ol>
          </Section>

          <Section id="sdk" title="SDK reference">
            <h3 className="text-lg font-medium">
              <Code>usePush</Code>
            </h3>
            <p>Returns subscription helpers and reactive state.</p>
            <Table
              rows={[
                [
                  "apiBase",
                  "string",
                  "Full URL of the project's API base. Use the value shown in the SDK setup card.",
                ],
                ["vapidPublicKey", "string", "Project VAPID public key."],
                [
                  "userId",
                  "string?",
                  "Optional — your application user id. Lets the dashboard / REST API target sends to specific users.",
                ],
                ["swPath", "string?", "Defaults to /sw.js."],
                [
                  "swScope",
                  "string?",
                  'Override the SW registration scope (e.g. "/" when serving from a sub-path).',
                ],
              ]}
            />
            <p>
              Returned: <Code>subscribe()</Code>, <Code>unsubscribe()</Code>,{" "}
              <Code>subscription</Code>, <Code>permission</Code>, <Code>isSupported</Code>,{" "}
              <Code>isSubscribing</Code>, <Code>error</Code>.
            </p>
          </Section>

          <Section id="rest-api" title="REST API">
            <p>
              Base URL: <Code>https://nesh.kkweb.io/api/v1/projects/&lt;projectId&gt;</Code>
            </p>

            <h3 className="text-lg font-medium">Subscribe</h3>
            <p>
              Called by the SDK after the browser issues a push subscription. CORS-enabled, no auth.
            </p>
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
              Rate limited 60 / minute per IP × project × action. The endpoint also enforces the
              free-tier subscriber cap on new endpoints (existing endpoints can always update).
            </p>

            <h3 className="text-lg font-medium">Unsubscribe</h3>
            <Snippet
              lang="bash"
              code={`DELETE /api/v1/projects/<projectId>?endpoint=<urlencoded-endpoint>

→ 200 { "ok": true }`}
            />

            <h3 className="text-lg font-medium">Send notification</h3>
            <p>
              Server-to-server. Use the <Code>Bearer</Code> token from the project's API key card
              (format <Code>nesh_sk_…</Code>). Synchronous — the response includes delivery counts.
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
              Subject to the monthly send cap (10,000 / project / UTC month on the free tier).
              Returns <Code>429</Code> when reached.
            </p>

            <h3 className="text-lg font-medium">Track event (SDK / SW)</h3>
            <p>
              Service Workers POST shown / clicked beacons here automatically when the SDK is v0.6+.
              You shouldn't normally call this from your code.
            </p>
            <Snippet
              lang="bash"
              code={`POST /api/v1/projects/<projectId>/notifications/<notificationId>/events
Content-Type: application/json

{ "type": "shown" }   // or "clicked"

→ 200 { "ok": true }`}
            />
          </Section>

          <Section id="webhooks" title="Webhooks">
            <p>
              Configure one or more webhook URLs on the project page. Every enabled webhook receives
              a JSON <Code>POST</Code> signed with <Code>HMAC-SHA256</Code> for each event. Failed
              deliveries (5xx / 408 / 429 / network errors) are retried with exponential backoff
              (30s → 2m → 10m → 1h, 5 attempts max). The <Code>X-Nesh-Attempt</Code> header counts
              the attempt number when retried.
            </p>
            <p>
              Each webhook can be filtered to a subset of event types from the project page. The
              default (all checkboxes selected) subscribes the webhook to every event.
            </p>

            <h3 className="text-lg font-medium">Events</h3>
            <Table
              rows={[
                [
                  "notification.sent",
                  "After a notification finishes sending (dashboard / REST / cron).",
                ],
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

            <h3 className="text-lg font-medium">notification.sent</h3>
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

            <h3 className="text-lg font-medium">subscription.created</h3>
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

            <h3 className="text-lg font-medium">subscription.removed</h3>
            <p>
              <Code>reason: "client"</Code> means the SDK / dashboard called <Code>DELETE</Code>;{" "}
              <Code>reason: "expired"</Code> means the push service returned 404/410 during a send
              and Nesh dropped the dead subscription automatically.
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
            <h3 className="text-lg font-medium">Verifying the signature (Node.js)</h3>
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
              Always compare bodies as raw bytes (read the request body before parsing JSON).
              Webhook delivery has a 5-second timeout; non-2xx responses are recorded as the last
              delivery error and shown on the dashboard.
            </p>
          </Section>

          <Section id="limits" title="Free-tier limits">
            <Table
              rows={[
                ["Projects per user", "1"],
                ["Subscribers per project", "5,000"],
                ["Sends per project per UTC month", "10,000"],
                ["Webhook delivery timeout", "5 s"],
                ["Subscribe / unsubscribe rate limit", "60 / min per IP × project × action"],
                ["Event tracking rate limit", "600 / min per IP × project"],
              ]}
            />
            <p>
              Hard caps return <Code>403</Code> (subscribers) or <Code>429</Code> (sends).{" "}
              <Link href="/" className="underline-offset-2 hover:underline">
                More on the FAQ
              </Link>
              .
            </p>
          </Section>
        </article>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© 2026 Nesh · MIT</span>
          <div className="flex gap-4">
            <a href="https://github.com/piro0919/nesh" className="hover:text-foreground">
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@piro0919/next-push"
              className="hover:text-foreground"
            >
              SDK
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-3">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{children}</code>;
}

function Snippet({ code, lang }: { code: string; lang?: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
      <code data-lang={lang}>{code}</code>
    </pre>
  );
}

function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="ml-5 flex list-decimal flex-col gap-3">{children}</ol>;
}

function Table({ rows }: { rows: Array<[string, string, string?]> }) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-xs">
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b last:border-b-0">
              <td className="w-1/4 px-3 py-2 align-top font-medium">
                <Code>{row[0]}</Code>
              </td>
              {row.length === 3 ? (
                <>
                  <td className="w-1/4 px-3 py-2 align-top text-muted-foreground">
                    <Code>{row[1]}</Code>
                  </td>
                  <td className="px-3 py-2 align-top">{row[2]}</td>
                </>
              ) : (
                <td className="px-3 py-2 align-top">{row[1]}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
