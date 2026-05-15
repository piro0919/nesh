"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/docs", key: "intro" },
  { href: "/docs/quick-start", key: "quickStart" },
  { href: "/docs/sdk", key: "sdk" },
  { href: "/docs/rest-api", key: "restApi" },
  { href: "/docs/webhooks", key: "webhooks" },
  { href: "/docs/limits", key: "limits" },
  { href: "/docs/self-host", key: "selfHost" },
] as const;

export function DocsSidebar() {
  const pathname = usePathname();
  const t = useTranslations("docs.nav");
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative rounded px-3 py-1.5 transition",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
