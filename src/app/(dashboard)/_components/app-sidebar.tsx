"use client";

import { BookOpen, FolderKanban, LogOut, Shield, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/_actions";
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
import { ProjectSidebarNav } from "./project-sidebar-nav";

type Project = { id: string; name: string };

type Props = {
  email: string;
  isAdmin: boolean;
  projects: Project[];
};

const PROJECT_ROUTE = /^\/projects\/([^/]+)/;

export function AppSidebar({ email, isAdmin, projects }: Props) {
  const pathname = usePathname();
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
                  tooltip="Projects"
                >
                  <Link href="/projects">
                    <FolderKanban />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/account")} tooltip="Account">
                  <Link href="/account">
                    <User />
                    <span>Account</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip="Admin">
                    <Link href="/admin">
                      <Shield />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Docs">
                  <Link href="/docs">
                    <BookOpen />
                    <span>Docs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {email}
        </div>
        <form action={signOut}>
          <SidebarMenuButton type="submit" tooltip="Sign out">
            <LogOut />
            <span>Sign out</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
