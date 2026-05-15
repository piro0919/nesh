import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DefaultsCard } from "../_components/defaults-card";
import { DeleteProjectButton } from "../_components/delete-button";
import { ProjectName } from "../_components/project-name";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const t = await getTranslations("dashboard.settingsPage");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, vapid_subject, created_at, default_icon, default_badge")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("info")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">{t("name")}</span>
            <ProjectName projectId={project.id} name={project.name} />
          </div>
          <div>
            <span className="text-muted-foreground">{t("id")}: </span>
            <code className="text-xs">{project.id}</code>
          </div>
          <div>
            <span className="text-muted-foreground">{t("vapidSubject")}: </span>
            <code className="text-xs">{project.vapid_subject}</code>
          </div>
          <div>
            <span className="text-muted-foreground">{t("created")}: </span>
            {new Date(project.created_at).toLocaleString(locale)}
          </div>
        </CardContent>
      </Card>

      <DefaultsCard
        projectId={project.id}
        defaultIcon={project.default_icon}
        defaultBadge={project.default_badge}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">{t("dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t("dangerDesc")}</p>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </CardContent>
      </Card>
    </div>
  );
}
