import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsChart } from "../_components/analytics-chart";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const t = await getTranslations("dashboard.analyticsPage");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data: errors } = await supabase
    .from("error_logs")
    .select("id, context, message, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader title={t("title")} />
      <AnalyticsChart projectId={project.id} />
      <Card>
        <CardHeader>
          <CardTitle>{t("errors")}</CardTitle>
        </CardHeader>
        <CardContent>
          {(errors?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noErrors")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-xs">
              {(errors ?? []).map((e) => (
                <li key={e.id} className="flex items-baseline gap-3 border-b py-1 last:border-b-0">
                  <span className="text-muted-foreground">
                    {new Date(e.created_at).toLocaleString(locale)}
                  </span>
                  <code className="text-xs">{e.context}</code>
                  <span className="truncate text-destructive" title={e.message}>
                    {e.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
