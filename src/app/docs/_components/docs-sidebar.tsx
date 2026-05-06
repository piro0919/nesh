"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/docs", label: "Introduction" },
  { href: "/docs/quick-start", label: "Quick start" },
  { href: "/docs/sdk", label: "SDK reference" },
  { href: "/docs/rest-api", label: "REST API" },
  { href: "/docs/webhooks", label: "Webhooks" },
  { href: "/docs/limits", label: "Free-tier limits" },
];

export function DocsSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded px-3 py-1.5 transition",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
