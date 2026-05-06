import Link from "next/link";
import { Code, H1 } from "./_components/primitives";

export const metadata = {
  title: "Docs — Nesh",
  description: "REST API, SDK, and webhook reference for Nesh.",
};

export default function Page() {
  return (
    <>
      <H1>Documentation</H1>
      <p className="text-muted-foreground">
        Everything you need to integrate Nesh: SDK quick start, REST API reference, and webhook
        signing.
      </p>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>
          <Link href="/docs/quick-start" className="underline-offset-2 hover:underline">
            Quick start
          </Link>{" "}
          — sign up, install the SDK, send your first notification.
        </li>
        <li>
          <Link href="/docs/sdk" className="underline-offset-2 hover:underline">
            SDK reference
          </Link>{" "}
          — <Code>usePush</Code> options and return values.
        </li>
        <li>
          <Link href="/docs/rest-api" className="underline-offset-2 hover:underline">
            REST API
          </Link>{" "}
          — subscribe, unsubscribe, send, track.
        </li>
        <li>
          <Link href="/docs/webhooks" className="underline-offset-2 hover:underline">
            Webhooks
          </Link>{" "}
          — event types, payload shapes, signature verification.
        </li>
        <li>
          <Link href="/docs/limits" className="underline-offset-2 hover:underline">
            Free-tier limits
          </Link>{" "}
          — caps and rate limits.
        </li>
      </ul>
    </>
  );
}
