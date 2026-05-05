import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/(auth)/_actions";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/projects" className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="" width={24} height={24} className="rounded" />
          Nesh
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/account" className="text-muted-foreground hover:text-foreground">
            {user.email}
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
