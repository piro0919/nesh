import { FolderPlus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const t = await getTranslations("dashboard.projectsList");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, created_at, subscriptions(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button asChild>
          <Link href="/projects/new">{t("new")}</Link>
        </Button>
      </div>
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title={t("empty")}
          description={t("emptyDesc")}
          action={
            <Button asChild>
              <Link href="/projects/new">{t("new")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((p) => {
            const count = (p.subscriptions as { count: number }[])[0]?.count ?? 0;
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="block">
                  <Card className="transition hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>{p.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {t("createdAt", {
                          date: new Date(p.created_at).toLocaleString(locale),
                        })}
                      </span>
                      <span>{t("subscribers", { count })}</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
