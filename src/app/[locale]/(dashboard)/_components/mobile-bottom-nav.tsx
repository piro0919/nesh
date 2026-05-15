"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  Code2,
  Download,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  MoreHorizontal,
  Settings,
  User,
  Users,
  Webhook,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { signOut } from "@/app/[locale]/(auth)/_actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean };

const PROJECT_ROUTE = /^\/projects\/([^/]+)/;

const PROJECT_ITEMS = [
  { key: "overview", icon: LayoutDashboard, suffix: "" },
  { key: "notifications", icon: Bell, suffix: "/notifications" },
  { key: "subscribers", icon: Users, suffix: "/subscribers" },
  { key: "webhooks", icon: Webhook, suffix: "/webhooks" },
  { key: "analytics", icon: BarChart3, suffix: "/analytics" },
  { key: "sdk", icon: Code2, suffix: "/sdk" },
  { key: "api", icon: KeyRound, suffix: "/api" },
  { key: "export", icon: Download, suffix: "/export" },
  { key: "settings", icon: Settings, suffix: "/settings" },
] as const;

export function MobileBottomNav({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("dashboard.sidebar");
  const tn = useTranslations("dashboard.projectNav");
  const tm = useTranslations("dashboard.mobileNav");
  const [moreOpen, setMoreOpen] = useState(false);
  const match = pathname.match(PROJECT_ROUTE);
  const projectId = match?.[1];

  const tabs: Tab[] = projectId
    ? (() => {
        const base = `/projects/${projectId}`;
        return [
          {
            href: base,
            label: tn("overview"),
            icon: LayoutDashboard,
            match: (p) => p === base,
          },
          {
            href: `${base}/notifications`,
            label: tn("notifications"),
            icon: Bell,
            match: (p) => p.startsWith(`${base}/notifications`),
          },
          {
            href: `${base}/subscribers`,
            label: tn("subscribers"),
            icon: Users,
            match: (p) => p.startsWith(`${base}/subscribers`),
          },
        ];
      })()
    : [
        {
          href: "/projects",
          label: t("projects"),
          icon: FolderKanban,
          match: (p) => p === "/projects" || p.startsWith("/projects/"),
        },
        {
          href: "/docs",
          label: t("docs"),
          icon: BookOpen,
          match: (p) => p.startsWith("/docs"),
        },
        {
          href: "/account",
          label: t("account"),
          icon: User,
          match: (p) => p === "/account",
        },
      ];

  return (
    <>
      <nav
        aria-label={tm("primary")}
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {tabs.map(({ href, label, icon: Icon, match: matchFn }) => {
          const active = matchFn(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs outline-none",
              moreOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            <span>{tm("more")}</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
            <SheetHeader>
              <SheetTitle>{tm("more")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-6">
              {projectId ? (
                <div className="flex flex-col gap-1">
                  <h3 className="px-2 pt-2 text-xs font-medium text-muted-foreground">
                    {tm("projectSection")}
                  </h3>
                  {PROJECT_ITEMS.slice(3).map(({ key, icon: Icon, suffix }) => (
                    <Link
                      key={key}
                      href={`/projects/${projectId}${suffix}`}
                      onClick={() => setMoreOpen(false)}
                      className="-mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {tn(key)}
                    </Link>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-col gap-1">
                <h3 className="px-2 pt-2 text-xs font-medium text-muted-foreground">
                  {tm("appSection")}
                </h3>
                {projectId ? (
                  <Link
                    href="/projects"
                    onClick={() => setMoreOpen(false)}
                    className="-mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <FolderKanban className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {t("projects")}
                  </Link>
                ) : null}
                <Link
                  href="/account"
                  onClick={() => setMoreOpen(false)}
                  className="-mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {t("account")}
                </Link>
                <Link
                  href="/docs"
                  onClick={() => setMoreOpen(false)}
                  className="-mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {t("docs")}
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={() => setMoreOpen(false)}
                    className="-mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {t("admin")}
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 border-t pt-3">
                <div className="px-2 text-xs text-muted-foreground">{email}</div>
                <div className="flex items-center gap-2 px-1">
                  <LanguageSwitcher className="flex-1 justify-start" />
                  <ThemeToggle />
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {t("signOut")}
                  </button>
                </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
