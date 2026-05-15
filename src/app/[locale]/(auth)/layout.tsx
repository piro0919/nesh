import Image from "next/image";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth.layout");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-muted/40 p-10 lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="-top-32 -left-20 absolute h-[460px] w-[460px] rounded-full bg-primary/15 blur-3xl" />
          <div className="-bottom-40 -right-20 absolute h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <Link href="/" className="relative flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" />
          Nesh
        </Link>
        <div className="relative flex flex-col gap-4">
          <blockquote className="text-2xl font-medium leading-snug tracking-tight">
            {t("quote")}
          </blockquote>
          <p className="text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              {t("home")}
            </Link>
            <Link href="/docs" className="hover:text-foreground">
              {t("docs")}
            </Link>
            <a
              href="https://github.com/piro0919/nesh"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              {t("github")}
            </a>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
            Nesh
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
            {t("docs")}
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">{children}</div>
      </main>
    </div>
  );
}
