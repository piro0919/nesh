import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  Code2,
  Database,
  KeyRound,
  ShieldCheck,
  Triangle,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CodeBlock } from "@/components/code-block";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Reveal } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { HeroNotifications } from "./hero-notifications";

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
  const t = useTranslations("landing.nav");
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="text-lg font-semibold">Nesh</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs">{t("docs")}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="https://github.com/piro0919/nesh" target="_blank" rel="noreferrer">
              {t("github")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">{t("signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">{t("getStarted")}</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">{t("signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">{t("getStarted")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const t = useTranslations("landing.hero");
  return (
    <section className="relative overflow-hidden border-b">
      {/* Background glow — fades behind the hero, subtle brand tint */}
      <div aria-hidden className="-z-10 pointer-events-none absolute inset-0">
        <div className="-top-32 -right-20 absolute h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl" />
        <div className="-bottom-40 -left-20 absolute h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-14 md:py-28">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("badge")}
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            {t("titleLine1")}
            <br />
            <span className="bg-linear-to-br from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              {t("titleLine2")}
            </span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
              <Link href="/sign-up">
                {t("ctaPrimary")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/docs">{t("ctaSecondary")}</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("ctaFooter")}</p>
        </div>
        <HeroMock altText={t("imageAlt")} />
      </div>
    </section>
  );
}

function HeroMock({ altText }: { altText: string }) {
  const t = useTranslations("landing.hero.samples");
  const samples = [
    { title: t("0.title"), body: t("0.body") },
    { title: t("1.title"), body: t("1.body") },
    { title: t("2.title"), body: t("2.body") },
    { title: t("3.title"), body: t("3.body") },
    { title: t("4.title"), body: t("4.body") },
  ];
  return (
    <div className="relative" role="img" aria-label={altText}>
      <div aria-hidden className="-inset-6 absolute rounded-3xl bg-primary/15 blur-2xl" />

      {/* Browser-like surface */}
      <div className="relative overflow-hidden rounded-2xl border bg-zinc-950 shadow-2xl shadow-primary/20">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-zinc-800 border-b bg-zinc-900 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 flex-1 truncate rounded-md bg-zinc-800 px-2.5 py-1 text-[10px] text-zinc-300">
            your-app.example
          </span>
        </div>

        {/* Faint page skeleton */}
        <div className="relative aspect-4/3 p-5 sm:p-6">
          <div className="flex flex-col gap-3 opacity-50">
            <div className="h-2 w-1/3 rounded bg-zinc-700" />
            <div className="h-2 w-2/3 rounded bg-zinc-800" />
            <div className="h-2 w-1/2 rounded bg-zinc-800" />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="h-16 rounded-lg bg-zinc-800" />
              <div className="h-16 rounded-lg bg-zinc-800" />
              <div className="h-16 rounded-lg bg-zinc-800" />
            </div>
          </div>

          <HeroNotifications samples={samples} />
        </div>
      </div>
    </div>
  );
}

function TrustLine() {
  const t = useTranslations("landing.trust");
  const chips = [
    { icon: Triangle, label: t("item1") },
    { icon: Database, label: t("item2") },
    { icon: Bell, label: t("item3") },
    { icon: ShieldCheck, label: t("item4") },
  ];
  return (
    <div className="border-b bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-5 sm:gap-3 sm:px-6">
        {chips.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-muted-foreground text-xs shadow-sm backdrop-blur-sm"
          >
            <Icon className="size-3.5 text-primary/80" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURE_KEYS = ["send", "rest", "userIds", "webhooks", "analytics", "openSource"] as const;
const FEATURE_ICONS: Record<(typeof FEATURE_KEYS)[number], typeof Zap> = {
  send: Zap,
  rest: KeyRound,
  userIds: Users,
  webhooks: Webhook,
  analytics: BarChart3,
  openSource: Code2,
};

function Features() {
  const t = useTranslations("landing.features");
  return (
    <section className="border-b">
      <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-10 flex flex-col gap-2 text-center md:mb-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((key) => {
            const Icon = FEATURE_ICONS[key];
            return (
              <div
                key={key}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold">{t(`items.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`items.${key}.body`)}</p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

const COMPARISON_ROW_KEYS = [
  "time",
  "pricing",
  "vapid",
  "oss",
  "dashboard",
  "webhooks",
  "segments",
] as const;

// Rows where the "yes/built-in" type values should render with a ✓ instead of text.
const POSITIVE_VALUES = new Set(["Yes", "Built-in", "MIT", "対応", "あり", "標準搭載"]);

function CellValue({ value, tone }: { value: string; tone: "primary" | "muted" }) {
  const positive = POSITIVE_VALUES.has(value);
  if (positive) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium",
          tone === "primary" ? "text-primary" : "text-foreground/70",
        )}
      >
        <Check className="size-4" />
        {value}
      </span>
    );
  }
  return (
    <span className={tone === "primary" ? "font-medium text-foreground" : "text-muted-foreground"}>
      {value}
    </span>
  );
}

function Comparison() {
  const t = useTranslations("landing.comparison");
  return (
    <section className="border-b bg-muted/20">
      <Reveal className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b text-xs">
              <tr>
                <th className="bg-muted/30 px-4 py-3 text-left font-medium text-muted-foreground">
                  {t("colFeature")}
                </th>
                <th className="border-x border-primary/20 bg-primary/5 px-4 py-3 text-left font-semibold text-primary">
                  {t("colNesh")}
                </th>
                <th className="bg-muted/30 px-4 py-3 text-left font-medium text-muted-foreground">
                  {t("colOneSignal")}
                </th>
                <th className="bg-muted/30 px-4 py-3 text-left font-medium text-muted-foreground">
                  {t("colRollOwn")}
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROW_KEYS.map((key) => (
                <tr key={key} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{t(`rows.${key}.feature`)}</td>
                  <td className="border-x border-primary/20 bg-primary/5 px-4 py-3">
                    <CellValue value={t(`rows.${key}.nesh`)} tone="primary" />
                  </td>
                  <td className="px-4 py-3">
                    <CellValue value={t(`rows.${key}.onesignal`)} tone="muted" />
                  </td>
                  <td className="px-4 py-3">
                    <CellValue value={t(`rows.${key}.rollOwn`)} tone="muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}

function DashboardPreview() {
  const t = useTranslations("landing.dashboardPreview");
  return (
    <section className="border-b bg-muted/20">
      <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="mb-12 flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="relative">
          <div aria-hidden className="-inset-6 absolute rounded-3xl bg-primary/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-xl border bg-background shadow-2xl shadow-primary/10">
            <Image
              src="/dashboard-preview.png"
              alt={t("imageAlt")}
              width={1600}
              height={1000}
              sizes="(min-width: 1024px) 800px, 100vw"
              className="h-auto w-full"
            />
          </div>

          {/* Callouts — hidden on mobile (image is too small to anchor) */}
          {/* Anchor → Subscribers stat card */}
          <Callout x="left-[10%]" y="top-[34%]" align="left" label={t("callout.subs")} />
          {/* Anchor → History panel (right-bottom) */}
          <Callout x="right-[6%]" y="top-[64%]" align="right" label={t("callout.history")} />
          {/* Anchor → New notification form (left-bottom) */}
          <Callout x="left-[10%]" y="bottom-[14%]" align="left" label={t("callout.compose")} />
        </div>
      </Reveal>
    </section>
  );
}

function Callout({
  x,
  y,
  align,
  label,
}: {
  x: string;
  y: string;
  align: "left" | "right";
  label: string;
}) {
  return (
    <div className={cn("absolute hidden md:block", x, y)}>
      <div className={cn("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
          <span className="relative h-3 w-3 rounded-full bg-primary shadow-md shadow-primary/40" />
        </span>
        <span
          aria-hidden
          className={cn("h-px w-8 bg-primary/40", align === "right" && "rotate-180")}
        />
        <span className="whitespace-nowrap rounded-full border border-primary/30 bg-background/90 px-3 py-1 text-xs font-medium shadow-md backdrop-blur-sm">
          {label}
        </span>
      </div>
    </div>
  );
}

function HowItWorks() {
  const t = useTranslations("landing.howItWorks");
  return (
    <section className="dark relative overflow-hidden border-b bg-zinc-950 text-zinc-50">
      {/* Subtle brand glow on the dark section */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="-top-40 absolute left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>
      <Reveal className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <div className="mb-12 flex flex-col gap-2 text-center md:mb-14">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="text-zinc-400">{t("subtitle")}</p>
        </div>
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <Step n={1} title={t("step1Title")} body={t("step1Body")} />
          <Step n={2} title={t("step2Title")} body={t("step2Body")} />
          <Step n={3} title={t("step3Title")} body={t("step3Body")} />
        </div>
        <CodeBlock
          lang="tsx"
          code={`'use client';
import { usePush } from "@piro0919/next-push";

export function Subscribe() {
  const { subscribe } = usePush({
    apiBase: "https://nesh.kkweb.io/api/v1/projects/<projectId>",
    vapidPublicKey: "<VAPID public key>",
    userId: currentUser.id, // optional — target sends by user
  });
  return <button onClick={subscribe}>Enable notifications</button>;
}`}
        />
      </Reveal>
    </section>
  );
}

const PRICING_ITEM_KEYS = ["projects", "subscribers", "sends", "webhooks", "extras"] as const;

function Pricing() {
  const t = useTranslations("landing.pricing");
  return (
    <section className="relative overflow-hidden border-b bg-muted/20">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="-translate-x-1/2 absolute top-1/2 left-1/2 h-[420px] w-[820px] -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <Reveal className="relative mx-auto max-w-2xl px-4 py-20 sm:px-6 md:py-28">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="max-w-md text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="relative rounded-2xl border border-primary/30 bg-background p-8 shadow-xl shadow-primary/10 ring-1 ring-primary/10 sm:p-10">
          {/* "Free during early access" pill, top-center */}
          <div className="-top-3 absolute left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary px-3 py-1 text-primary-foreground text-xs font-medium shadow-md shadow-primary/30">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              {t("badge")}
            </span>
          </div>

          <div className="mb-6 flex flex-col items-center gap-1">
            <div className="flex items-baseline gap-2">
              <span className="bg-linear-to-br from-primary via-primary to-primary/70 bg-clip-text text-7xl font-semibold tabular-nums tracking-tight text-transparent sm:text-8xl">
                {t("price")}
              </span>
              <span className="text-muted-foreground text-sm">{t("per")}</span>
            </div>
            <span className="text-muted-foreground text-xs">{t("planName")}</span>
          </div>

          <ul className="mb-8 grid gap-3 text-sm sm:grid-cols-2">
            {PRICING_ITEM_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{t(`items.${key}`)}</span>
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="w-full shadow-lg shadow-primary/30">
            <Link href="/sign-up">
              {t("cta")} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

const FAQ_KEYS = ["free", "vsOneSignal", "selfHost", "native", "privacy"] as const;

function Faq() {
  const t = useTranslations("landing.faq");
  return (
    <section className="border-b">
      <Reveal className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-20">
        <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                {t(`items.${key}.q`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {key === "selfHost"
                  ? t.rich(`items.${key}.a`, {
                      selfHost: (chunks) => (
                        <Link
                          href="/docs/self-host"
                          className="text-foreground underline underline-offset-2"
                        >
                          {chunks}
                        </Link>
                      ),
                    })
                  : t(`items.${key}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}

function FinalCta() {
  const t = useTranslations("landing.finalCta");
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="-translate-x-1/2 absolute top-1/2 left-1/2 h-[420px] w-[820px] -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>
      <Reveal className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 md:py-28">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="shadow-lg shadow-primary/30">
            <Link href="/sign-up">
              {t("ctaPrimary")} <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com/piro0919/nesh" target="_blank" rel="noreferrer">
              {t("ctaSecondary")}
            </a>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30">
        {n}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-zinc-400">{body}</p>
    </div>
  );
}

function SiteFooter() {
  const t = useTranslations("landing.footer");
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <span>{t("copy")}</span>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/docs" className="hover:text-foreground">
            {t("docs")}
          </Link>
          <Link href="/sign-in" className="hover:text-foreground">
            {t("signIn")}
          </Link>
          <Link href="/sign-up" className="hover:text-foreground">
            {t("signUp")}
          </Link>
          <Link
            href="https://github.com/piro0919/nesh"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            {t("github")}
          </Link>
          <Link
            href="https://github.com/piro0919/next-push"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            {t("sdk")}
          </Link>
          <LanguageSwitcher className="ml-2" />
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
