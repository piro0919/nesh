"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/[locale]/(auth)/_actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

function initials(email: string): string {
  const base = email.split("@")[0] ?? "";
  return (base.slice(0, 2) || "??").toUpperCase();
}

type Props = {
  email: string;
  /** "sidebar" (full row, used in SidebarFooter) | "compact" (avatar-only trigger for mobile top bar) */
  variant?: "sidebar" | "compact";
  /** DropdownMenuContent side */
  side?: "top" | "right" | "bottom" | "left";
};

export function UserMenu({ email, variant = "sidebar", side = "right" }: Props) {
  const t = useTranslations("dashboard.sidebar");
  const handle = email.split("@")[0] ?? email;

  const trigger =
    variant === "compact" ? (
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={t("account")}
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials(email)}</AvatarFallback>
        </Avatar>
      </button>
    ) : (
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarFallback className="rounded-lg">{initials(email)}</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{handle}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 opacity-60" />
      </SidebarMenuButton>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align="end"
        sideOffset={8}
        className="min-w-(--radix-dropdown-menu-trigger-width) min-w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{initials(email)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{handle}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-1 px-1 py-1">
          <LanguageSwitcher className="flex-1 justify-start" />
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <form action={signOut} className="contents">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer">
              <LogOut />
              {t("signOut")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
