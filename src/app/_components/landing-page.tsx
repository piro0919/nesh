import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold">Nesh</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Web Push, made simple
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Web Push notifications,
            <br />
            made simple.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            A lightweight alternative to OneSignal for Next.js / React projects. Sign up, drop the
            SDK in, start sending — in minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Get started — free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://github.com/piro0919/nesh" target="_blank" rel="noreferrer">
                View on GitHub
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Open source · MIT · Self-host friendly</p>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-3">
            <Feature title="Simple" body="No segmentation, no journeys, no A/B. Just send." />
            <Feature
              title="Fast to start"
              body="Sign up → drop the SDK → send your first push in under 5 minutes."
            />
            <Feature
              title="Open source"
              body="MIT licensed. Read the code, fork it, or self-host."
            />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold">How it works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Step
              n={1}
              title="Create a project"
              body="Sign up and create a project in the dashboard. We generate VAPID keys for you."
            />
            <Step
              n={2}
              title="Drop in the SDK"
              body="Install @piro0919/next-push and pass the apiBase + publicKey from your project setup screen."
            />
            <Step
              n={3}
              title="Send"
              body="Compose a notification in the dashboard. Send immediately or schedule it."
            />
          </div>
          <pre className="mt-10 overflow-x-auto rounded-lg border bg-muted p-6 text-xs">
            <code>{`'use client';
import { usePush } from "@piro0919/next-push";

export function Subscribe() {
  const { subscribe } = usePush({
    apiBase: "https://nesh.kkweb.io/api/v1/projects/<projectId>",
    publicKey: "<VAPID public key>",
  });
  return <button onClick={subscribe}>Enable notifications</button>;
}`}</code>
          </pre>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="mb-8 text-center text-2xl font-semibold">FAQ</h2>
            <div className="flex flex-col gap-6 text-sm">
              <Faq
                q="Is it free?"
                a="Yes, free during the early phase. Long-term pricing isn't decided yet — Nesh is a side project run by one developer, not a VC-backed startup."
              />
              <Faq
                q="Why not just use OneSignal?"
                a="OneSignal is great if you need segmentation, A/B, journeys. Nesh is for people who find that overkill and want a tiny dashboard with the essentials."
              />
              <Faq
                q="Can I self-host?"
                a="Technically yes — the code is MIT and runs on any Postgres + Vercel-compatible host. Documentation for self-hosting is on the roadmap."
              />
              <Faq
                q="What about iOS / Android native?"
                a="Web Push only for now. Web Push works on iOS Safari (16.4+) when installed as a PWA."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>© 2026 Nesh · MIT</span>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/piro0919/nesh"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </Link>
            <Link
              href="https://github.com/piro0919/next-push"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              SDK
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-background p-6">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {n}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="mb-1 font-medium">{q}</h3>
      <p className="text-muted-foreground">{a}</p>
    </div>
  );
}
