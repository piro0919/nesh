"use client";

import { useTranslations } from "next-intl";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, usePathname } from "@/i18n/navigation";

type Crumb = { label: string; href?: string };

type Project = { id: string; name: string };

function buildCrumbs(
  pathname: string,
  projects: Project[],
  t: (key: string) => string,
  tn: (key: string) => string,
): Crumb[] {
  if (pathname === "/account") return [{ label: t("sidebar.account") }];
  if (pathname === "/admin") return [{ label: t("sidebar.admin") }];
  if (pathname === "/projects") return [{ label: t("sidebar.projects") }];
  if (pathname === "/projects/new") {
    return [{ label: t("sidebar.projects"), href: "/projects" }, { label: t("projectsList.new") }];
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)(\/.*)?$/);
  if (projectMatch) {
    const [, projectId, rest = ""] = projectMatch;
    const project = projects.find((p) => p.id === projectId);
    const projectLabel = project?.name ?? projectId.slice(0, 8);
    const base: Crumb[] = [
      { label: t("sidebar.projects"), href: "/projects" },
      { label: projectLabel, href: rest ? `/projects/${projectId}` : undefined },
    ];

    if (!rest) return base;

    const segments = rest.split("/").filter(Boolean);
    const [section, ...sub] = segments;
    const projectBase = `/projects/${projectId}`;

    const sectionKeyMap: Record<string, string> = {
      analytics: "analytics",
      api: "api",
      export: "export",
      notifications: "notifications",
      sdk: "sdk",
      settings: "settings",
      subscribers: "subscribers",
      webhooks: "webhooks",
    };

    const sectionKey = sectionKeyMap[section ?? ""];
    if (!sectionKey) return base;

    const sectionLabel = tn(sectionKey);
    // Deeper than the section root → keep section link, then append a generic tail.
    const sectionHref = sub.length > 0 ? `${projectBase}/${section}` : undefined;
    const crumbs: Crumb[] = [...base, { label: sectionLabel, href: sectionHref }];

    // Special leaves we know how to label.
    if (section === "notifications" && sub[0] === "new") {
      crumbs.push({ label: t("newNotification.title") });
    } else if (section === "webhooks" && sub[2] === "deliveries") {
      crumbs.push({ label: t("deliveryDetail.title") });
    }

    return crumbs;
  }

  return [];
}

export function Breadcrumbs({ projects }: { projects: Project[] }) {
  const pathname = usePathname();
  const tDashboard = useTranslations("dashboard");
  const tProjectNav = useTranslations("dashboard.projectNav");
  const crumbs = buildCrumbs(
    pathname,
    projects,
    (k) => tDashboard(k),
    (k) => tProjectNav(k),
  );

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${c.href ?? "leaf"}-${c.label}`}>
              <BreadcrumbItem>
                {last || !c.href ? (
                  <BreadcrumbPage className="max-w-48 truncate">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href} className="max-w-48 truncate">
                      {c.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {last ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
