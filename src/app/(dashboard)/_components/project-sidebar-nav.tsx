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
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ITEMS = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/subscribers", label: "Subscribers", icon: Users },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/sdk", label: "SDK setup", icon: Code2 },
  { href: "/api", label: "REST API", icon: KeyRound },
  { href: "/export", label: "Export", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ProjectSidebarNav({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="truncate" title={projectName}>
        {projectName}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const full = `${base}${href}`;
            const active = href === "" ? pathname === full : pathname.startsWith(full);
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
