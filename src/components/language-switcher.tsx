"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const shortLabels: Record<Locale, string> = {
  ja: "JA",
  en: "EN",
};

const fullLabels: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
};

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact = false }: Props) {
  const current = useLocale() as Locale;
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const next = routing.locales.find((l) => l !== current) ?? current;
  const label = compact ? shortLabels[next] : fullLabels[next];

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`${t("language")}: ${fullLabels[next]}`}
      title={fullLabels[next]}
      disabled={pending}
      className={cn("h-8 gap-1.5 px-2 text-xs text-muted-foreground", className)}
      onClick={() => {
        startTransition(() => {
          // `pathname` from next-intl strips the locale prefix and includes
          // any dynamic segments with their actual values — passing it back
          // under the target locale is enough.
          router.replace(pathname, { locale: next });
        });
      }}
    >
      <Languages aria-hidden className="size-3.5" />
      {label}
    </Button>
  );
}
