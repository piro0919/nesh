import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-muted/40 p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" />
          Nesh
        </Link>
        <div className="flex flex-col gap-4">
          <blockquote className="text-2xl font-medium leading-snug tracking-tight">
            "Web Push, made simple. Sign up, drop the SDK in, and start sending — in minutes."
          </blockquote>
          <p className="text-sm text-muted-foreground">
            Open source · MIT · Free during early access
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <a
            href="https://github.com/piro0919/nesh"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </aside>
      <main className="flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
            Nesh
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
            Docs
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">{children}</div>
      </main>
    </div>
  );
}
