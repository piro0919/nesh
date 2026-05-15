import { SearchX, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteSubscriptionButton } from "./_components/delete-subscription-button";

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

const PAGE_SIZE = 50;

export default async function Page({ params, searchParams }: Props) {
  const { projectId } = await params;
  const { q = "", page: pageRaw = "1" } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageRaw, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const t = await getTranslations("dashboard.subscribersPage");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  let listQuery = supabase
    .from("subscriptions")
    .select("id, endpoint, external_user_id, created_at", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const trimmed = q.trim();
  if (trimmed) {
    const escaped = trimmed.replace(/[%_]/g, "\\$&");
    listQuery = listQuery.or(`endpoint.ilike.%${escaped}%,external_user_id.ilike.%${escaped}%`);
  }

  const { data: subs, count, error } = await listQuery;
  if (error) throw error;

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title={t("heading", { name: project.name })}
        description={t("total", { count: total.toLocaleString(locale) })}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("search")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" action={`/projects/${project.id}/subscribers`}>
            <Input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t("searchPlaceholder")}
              className="max-w-md"
            />
            <Button type="submit" size="sm">
              {t("searchButton")}
            </Button>
            {trimmed ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/projects/${project.id}/subscribers`}>{t("clear")}</Link>
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {subs && subs.length > 0 ? (
            <ul className="divide-y">
              {subs.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {s.external_user_id ? (
                        <code className="rounded bg-muted px-2 py-0.5 text-xs">
                          {s.external_user_id}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("anonymous")}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleString(locale)}
                      </span>
                    </div>
                    <code className="truncate text-xs text-muted-foreground" title={s.endpoint}>
                      {s.endpoint}
                    </code>
                  </div>
                  <DeleteSubscriptionButton projectId={project.id} subscriptionId={s.id} />
                </li>
              ))}
            </ul>
          ) : trimmed ? (
            <EmptyState
              className="m-6"
              icon={SearchX}
              title={t("noMatches")}
              description={t("noMatchesDesc")}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${project.id}/subscribers`}>{t("clear")}</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              className="m-6"
              icon={UsersRound}
              title={t("empty")}
              description={t("emptyDesc")}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/docs/quick-start">{t("emptyCta")}</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {lastPage > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("page", { page, lastPage })}</span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={{
                    pathname: `/projects/${project.id}/subscribers`,
                    query: { ...(trimmed ? { q: trimmed } : {}), page: page - 1 },
                  }}
                >
                  {t("prev")}
                </Link>
              </Button>
            ) : null}
            {page < lastPage ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={{
                    pathname: `/projects/${project.id}/subscribers`,
                    query: { ...(trimmed ? { q: trimmed } : {}), page: page + 1 },
                  }}
                >
                  {t("next")}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
