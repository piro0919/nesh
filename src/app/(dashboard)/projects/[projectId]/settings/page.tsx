import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DefaultsCard } from "../_components/defaults-card";
import { DeleteProjectButton } from "../_components/delete-button";
import { ProjectName } from "../_components/project-name";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, vapid_subject, created_at, default_icon, default_badge")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Project info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Name</span>
            <ProjectName projectId={project.id} name={project.name} />
          </div>
          <div>
            <span className="text-muted-foreground">ID: </span>
            <code className="text-xs">{project.id}</code>
          </div>
          <div>
            <span className="text-muted-foreground">VAPID subject: </span>
            <code className="text-xs">{project.vapid_subject}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Created: </span>
            {new Date(project.created_at).toLocaleString()}
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
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Permanently delete this project, its subscribers, and all notification history.
          </p>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </CardContent>
      </Card>
    </div>
  );
}
