import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { DeleteProjectButton } from "./_components/delete-button";
import { SdkSetup } from "./_components/sdk-setup";

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

  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { head: true, count: "exact" })
    .eq("project_id", project.id);

  const apiBase = `${getSiteUrl()}/api/v1/projects/${project.id}`;

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
          <Row label="ID" value={project.id} mono />
          <Row label="Created" value={new Date(project.created_at).toLocaleString()} />
          <Row label="VAPID subject" value={project.vapid_subject} mono />
          <Row label="Subscribers" value={String(subscriberCount ?? 0)} />
        </CardContent>
      </Card>
      <SdkSetup apiBase={apiBase} publicKey={project.vapid_public_key} />
      <p className="text-sm text-muted-foreground">
        Notification creation and history will appear here in the next phase.
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      {mono ? <code className="text-xs">{value}</code> : <span>{value}</span>}
    </div>
  );
}
