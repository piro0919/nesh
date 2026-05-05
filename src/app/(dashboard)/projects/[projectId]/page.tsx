import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FREE_TIER, startOfCurrentMonthUtc } from "@/lib/limits";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { ApiKeyCard } from "./_components/api-key-card";
import { DeleteProjectButton } from "./_components/delete-button";
import { NotificationsList } from "./_components/notifications-list";
import { SdkSetup } from "./_components/sdk-setup";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, vapid_public_key, vapid_subject, api_key, created_at")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!project) notFound();

  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { head: true, count: "exact" })
    .eq("project_id", project.id);

  const { count: monthlySendCount } = await supabase
    .from("notifications")
    .select("*", { head: true, count: "exact" })
    .eq("project_id", project.id)
    .gte("created_at", startOfCurrentMonthUtc().toISOString());

  const apiBase = `${getSiteUrl()}/api/v1/projects/${project.id}`;
  const subs = subscriberCount ?? 0;
  const sends = monthlySendCount ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/projects/${project.id}/notifications/new`}>Send notification</Link>
          </Button>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row label="ID" value={project.id} mono />
          <Row label="Created" value={new Date(project.created_at).toLocaleString()} />
          <Row label="VAPID subject" value={project.vapid_subject} mono />
          <Row
            label="Subscribers"
            value={`${subs.toLocaleString()} / ${FREE_TIER.SUBSCRIBERS_PER_PROJECT.toLocaleString()}`}
          />
          <Row
            label="Sends this month (UTC)"
            value={`${sends.toLocaleString()} / ${FREE_TIER.NOTIFICATIONS_PER_MONTH.toLocaleString()}`}
          />
        </CardContent>
      </Card>
      <SdkSetup apiBase={apiBase} publicKey={project.vapid_public_key} />
      <ApiKeyCard projectId={project.id} apiKey={project.api_key} apiBase={apiBase} />
      <NotificationsList projectId={project.id} />
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
