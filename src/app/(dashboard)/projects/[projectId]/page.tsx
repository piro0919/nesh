import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DeleteProjectButton } from "./_components/delete-button";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, vapid_public_key, vapid_subject, created_at")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">ID: </span>
            <code className="text-xs">{project.id}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Created: </span>
            {new Date(project.created_at).toLocaleString()}
          </div>
          <div>
            <span className="text-muted-foreground">VAPID subject: </span>
            <code className="text-xs">{project.vapid_subject}</code>
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        SDK setup info, subscriber count, and notifications will appear here in later phases.
      </p>
    </div>
  );
}
