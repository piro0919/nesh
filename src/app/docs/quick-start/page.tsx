import { Code, H1, Ol, Snippet } from "../_components/primitives";

export const metadata = { title: "Quick start — Nesh docs" };

export default function Page() {
  return (
    <>
      <H1>Quick start</H1>
      <Ol>
        <li>
          <strong>Sign up</strong> at <Code>/sign-up</Code> and create a project. We generate a
          VAPID key pair for you and assign a per-project API key.
        </li>
        <li>
          Install the SDK in your Next.js / React app:
          <Snippet code={`pnpm add @piro0919/next-push`} lang="bash" />
        </li>
        <li>
          Drop in the <Code>usePush</Code> hook with the values from your project's "SDK setup"
          card:
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
          <Code>@piro0919/next-push/sw</Code> render notifications and fire shown / click tracking
          automatically:
          <Snippet
            code={`import { handlePush, handleClick } from "@piro0919/next-push/sw";

self.addEventListener("push", (event) => handlePush(event));
self.addEventListener("notificationclick", (event) => handleClick(event));`}
            lang="js"
          />
        </li>
        <li>Send your first notification from the dashboard, or via the REST API.</li>
      </Ol>
    </>
  );
}
