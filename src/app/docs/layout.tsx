import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DocsSidebar } from "./_components/docs-sidebar";

export const metadata = {
  title: "Docs — Nesh",
  description: "REST API, SDK, and webhook reference for Nesh.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold">
            Nesh
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[200px_minmax(0,1fr)] md:py-12">
        <aside className="md:sticky md:top-8 md:self-start">
          <DocsSidebar />
        </aside>
        <main className="min-w-0">
          <article className="flex flex-col gap-6 text-sm">{children}</article>
        </main>
      </div>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <span>© 2026 Nesh · MIT</span>
          <div className="flex gap-4">
            <a href="https://github.com/piro0919/nesh" className="hover:text-foreground">
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@piro0919/next-push"
              className="hover:text-foreground"
            >
              SDK
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
