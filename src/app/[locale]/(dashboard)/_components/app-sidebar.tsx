"use client";

import { BookOpen, FolderKanban, Shield, User } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { ProjectSidebarNav } from "./project-sidebar-nav";
import { UserMenu } from "./user-menu";

type Project = { id: string; name: string };

type Props = {
  email: string;
  isAdmin: boolean;
  projects: Project[];
};

const PROJECT_ROUTE = /^\/projects\/([^/]+)/;

export function AppSidebar({ email, isAdmin, projects }: Props) {
  const pathname = usePathname();
  const t = useTranslations("dashboard.sidebar");
  const match = pathname.match(PROJECT_ROUTE);
  const currentProjectId = match?.[1];
  const currentProject = currentProjectId
    ? projects.find((p) => p.id === currentProjectId)
    : undefined;

  const isActive = (href: string) =>
    href === "/projects"
      ? pathname === href || pathname.startsWith("/projects/")
      : pathname === href;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/projects" className="flex items-center gap-2 px-2 py-1 font-semibold">
          <Image src="/logo.png" alt="" width={24} height={24} className="rounded" />
          <span className="group-data-[collapsible=icon]:hidden">Nesh</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {currentProject ? (
          <ProjectSidebarNav projectId={currentProject.id} projectName={currentProject.name} />
        ) : null}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/projects") && !currentProject}
                  tooltip={t("projects")}
                >
                  <Link href="/projects">
                    <FolderKanban />
                    <span>{t("projects")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/account")} tooltip={t("account")}>
                  <Link href="/account">
                    <User />
                    <span>{t("account")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip={t("admin")}>
                    <Link href="/admin">
                      <Shield />
                      <span>{t("admin")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("docs")}>
                  <Link href="/docs">
                    <BookOpen />
                    <span>{t("docs")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu email={email} side="right" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
