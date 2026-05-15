"use client";

import {
  BarChart3,
  Bell,
  Code2,
  Download,
  KeyRound,
  LayoutDashboard,
  Settings,
  Users,
  Webhook,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "", key: "overview", icon: LayoutDashboard },
  { href: "/notifications", key: "notifications", icon: Bell },
  { href: "/subscribers", key: "subscribers", icon: Users },
  { href: "/webhooks", key: "webhooks", icon: Webhook },
  { href: "/analytics", key: "analytics", icon: BarChart3 },
  { href: "/sdk", key: "sdk", icon: Code2 },
  { href: "/api", key: "api", icon: KeyRound },
  { href: "/export", key: "export", icon: Download },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

export function ProjectSidebarNav({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("dashboard.projectNav");
  const base = `/projects/${projectId}`;
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="truncate" title={projectName}>
        {projectName}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {ITEMS.map(({ href, key, icon: Icon }) => {
            const full = `${base}${href}`;
            const active = href === "" ? pathname === full : pathname.startsWith(full);
            const label = t(key);
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={active} tooltip={label}>
                  <Link href={full}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
