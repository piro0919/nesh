import { cookies } from "next/headers";
import Image from "next/image";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "./_components/app-sidebar";
import { MobileBottomNav } from "./_components/mobile-bottom-nav";
import { UserMenu } from "./_components/user-menu";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const adminIds = new Set(
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const isAdmin = adminIds.has(user.id);

  // Free tier caps to 1 project/user, so this list is tiny — fetching here
  // lets the sidebar render project-specific sub-nav without a child layout.
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: true });

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const email = user.email ?? "";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar email={email} isAdmin={isAdmin} projects={projects ?? []} />
        <SidebarInset>
          {/* Desktop: SidebarTrigger only (sidebar carries the nav) */}
          <header className="hidden h-12 items-center gap-2 border-b px-4 md:flex">
            <SidebarTrigger />
          </header>
          {/* Mobile: logo + UserMenu avatar (bottom nav carries the rest) */}
          <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
            <Link href="/projects" className="flex items-center gap-2 font-semibold">
              <Image src="/logo.png" alt="" width={24} height={24} className="rounded" />
              <span>Nesh</span>
            </Link>
            <UserMenu email={email} variant="compact" side="bottom" />
          </header>
          <div className="flex-1 p-4 pb-24 sm:p-6 md:pb-6">{children}</div>
        </SidebarInset>
        <MobileBottomNav email={email} isAdmin={isAdmin} />
      </SidebarProvider>
    </TooltipProvider>
  );
}
