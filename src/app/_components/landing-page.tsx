import { ArrowRight, BarChart3, Code2, KeyRound, Users, Webhook, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustLine />
        <Features />
        <Comparison />
        <DashboardPreview />
        <HowItWorks />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="text-lg font-semibold">Nesh</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs">Docs</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="https://github.com/piro0919/nesh" target="_blank" rel="noreferrer">
              GitHub
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-12 md:py-24">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            Open source · Free during early access
          </span>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Web Push notifications,
            <br />
            <span className="text-muted-foreground">made simple.</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            A lightweight alternative to OneSignal for Next.js / React projects. Sign up, drop the
            SDK in, and start sending — in minutes.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Start free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            No credit card · MIT licensed · Self-host friendly
          </p>
        </div>
        <div>
          <Image
            src="/hero.png"
            alt="A browser window with a Nesh push notification sliding in from the top right"
            width={1200}
            height={800}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}

function TrustLine() {
  return (
    <div className="border-b bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <span>Built on Next.js 16</span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
        <span>Postgres + RLS via Supabase</span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
        <span>VAPID + Web Push standards</span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
        <span>HMAC-signed webhooks</span>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: Zap,
      title: "Send in seconds",
      body: "Compose in the dashboard or POST to a Bearer-auth endpoint. Synchronous response includes per-subscriber delivery counts.",
    },
    {
      icon: KeyRound,
      title: "REST API",
      body: "One endpoint per project. Use it from any backend, CI, or curl. No SDK required on the server.",
    },
    {
      icon: Users,
      title: "External user IDs",
      body: "Tag subscriptions with your own user IDs and target sends by user from the dashboard or REST.",
    },
    {
      icon: Webhook,
      title: "Signed webhooks",
      body: "HMAC-SHA256 signatures, exponential-backoff retry, per-event filtering. Delivery log + replay UI included.",
    },
    {
      icon: BarChart3,
      title: "Built-in analytics",
      body: "Shown / clicked beacons fire from the SDK service worker — no extra tools to wire up.",
    },
    {
      icon: Code2,
      title: "Open source",
      body: "MIT licensed end-to-end. Read the code, fork it, audit the storage. Self-hosting docs on the roadmap.",
    },
  ];
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-10 flex flex-col gap-2 text-center md:mb-12">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything you need, nothing you don't
          </h2>
          <p className="text-muted-foreground">
            No segmentation. No journeys. No A/B tests. Just send.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-3 rounded-lg border bg-card p-6">
              <Icon className="size-5" />
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const rows: Array<{ feature: string; nesh: string; onesignal: string; rollOwn: string }> = [
    { feature: "Time to first notification", nesh: "Minutes", onesignal: "Hours", rollOwn: "Days" },
    {
      feature: "Per-project pricing transparency",
      nesh: "Free tier in docs",
      onesignal: "Sales call",
      rollOwn: "Your AWS bill",
    },
    { feature: "Web Push standard (VAPID)", nesh: "Yes", onesignal: "Yes", rollOwn: "Yes" },
    { feature: "Open source", nesh: "MIT", onesignal: "No", rollOwn: "Your repo" },
    { feature: "Hosted dashboard", nesh: "Yes", onesignal: "Yes", rollOwn: "DIY" },
    { feature: "Signed webhooks", nesh: "Built-in", onesignal: "Built-in", rollOwn: "DIY" },
    {
      feature: "Segmentation / Journeys / A/B",
      nesh: "Out of scope",
      onesignal: "Yes",
      rollOwn: "DIY",
    },
  ];
  return (
    <section className="border-b bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Where Nesh fits</h2>
          <p className="text-muted-foreground">
            Built for solo devs and small teams who don't need enterprise marketing tooling.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Feature</th>
                <th className="px-4 py-3 text-left font-medium">Nesh</th>
                <th className="px-4 py-3 text-left font-medium">OneSignal</th>
                <th className="px-4 py-3 text-left font-medium">Roll your own</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feature} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{r.feature}</td>
                  <td className="px-4 py-3">{r.nesh}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.onesignal}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.rollOwn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            A dashboard that fits on one screen
          </h2>
          <p className="text-muted-foreground">
            No nested menus to learn. Every project's status at a glance.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border shadow-sm">
          <Image
            src="/dashboard-preview.png"
            alt="Nesh dashboard showing a project with subscriber count, monthly sends, and notification history"
            width={1600}
            height={1000}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-10 flex flex-col gap-2 text-center md:mb-12">
          <h2 className="text-3xl font-semibold tracking-tight">From signup to first send</h2>
          <p className="text-muted-foreground">Three steps, one code snippet.</p>
        </div>
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <Step
            n={1}
            title="Create a project"
            body="Sign up and create a project. We generate VAPID keys and an API key for you."
          />
          <Step
            n={2}
            title="Drop in the SDK"
            body={
              "Install @piro0919/next-push and pass apiBase + publicKey from the SDK setup screen."
            }
          />
          <Step
            n={3}
            title="Send"
            body="Compose in the dashboard, schedule it, or POST to the REST endpoint."
          />
        </div>
        <pre className="overflow-x-auto rounded-lg border bg-muted p-5 text-xs">
          <code>{`'use client';
import { usePush } from "@piro0919/next-push";

export function Subscribe() {
  const { subscribe } = usePush({
    apiBase: "https://nesh.kkweb.io/api/v1/projects/<projectId>",
    vapidPublicKey: "<VAPID public key>",
    userId: currentUser.id, // optional — target sends by user
  });
  return <button onClick={subscribe}>Enable notifications</button>;
}`}</code>
        </pre>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="border-b bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Free during early access</h2>
          <p className="text-muted-foreground">
            Long-term pricing isn't decided yet. Today's caps are explicit, in-product, and apply
            per-account.
          </p>
        </div>
        <div className="rounded-xl border bg-background p-6 sm:p-8">
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-semibold">$0</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {[
              "1 project per account",
              "5,000 subscribers per project",
              "10,000 sends per project per UTC month",
              "Unlimited webhooks (5s timeout, exponential retry)",
              "REST API + signed webhooks included",
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-foreground" />
                {line}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
            <Link href="/sign-up">Start free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const items: Array<{ q: string; a: string }> = [
    {
      q: "Is it really free?",
      a: "Yes, free during early access — within the caps shown above. Long-term pricing isn't decided yet (Nesh is a side project run by one developer, not a VC-backed startup).",
    },
    {
      q: "Why not just use OneSignal?",
      a: "OneSignal is great if you need segmentation, A/B tests, journeys. Nesh is for people who find that overkill and want a tiny dashboard with the essentials — and an open codebase.",
    },
    {
      q: "Can I self-host?",
      a: "Technically yes — the code is MIT and runs on any Postgres + Vercel-compatible host. Step-by-step self-hosting docs are on the roadmap.",
    },
    {
      q: "iOS / Android native?",
      a: "Web Push only for now. Web Push works on iOS Safari (16.4+) when installed as a PWA.",
    },
    {
      q: "Do you collect data?",
      a: "Subscriptions, notification metadata, and shown/clicked counts. No 3rd-party trackers. VAPID private keys are AES-256-GCM encrypted at rest.",
    },
  ];
  return (
    <section className="border-b">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-20">
        <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">FAQ</h2>
        <div className="flex flex-col gap-6">
          {items.map(({ q, a }) => (
            <div key={q}>
              <h3 className="mb-1 font-medium">{q}</h3>
              <p className="text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 md:py-20">
        <h2 className="text-3xl font-semibold tracking-tight">Ship Web Push this afternoon</h2>
        <p className="text-muted-foreground">
          No setup call. No credit card. No five-page onboarding.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {n}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <span>© 2026 Nesh · MIT</span>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <Link href="/sign-in" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/sign-up" className="hover:text-foreground">
            Sign up
          </Link>
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
  );
}
