import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { signPayload } from "@/lib/webhooks";

type Props = {
  params: Promise<{ projectId: string; webhookId: string; deliveryId: string }>;
};

export default async function Page({ params }: Props) {
  const { projectId, webhookId, deliveryId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data: webhook } = await supabase
    .from("webhooks")
    .select("id, name, url, secret")
    .eq("id", webhookId)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!webhook) notFound();

  const { data: delivery } = await supabase
    .from("webhook_deliveries")
    .select(
      "id, event_type, status_code, error, payload, attempts, next_attempt_at, response_body, created_at",
    )
    .eq("id", deliveryId)
    .eq("webhook_id", webhook.id)
    .maybeSingle();
  if (!delivery) notFound();

  const body = JSON.stringify(delivery.payload, null, 2);
  // Reproduce the headers we sent so receivers can replay verification locally.
  const requestHeaders: Record<string, string> = {
    "content-type": "application/json",
    "X-Nesh-Signature": signPayload(JSON.stringify(delivery.payload), webhook.secret),
    "X-Nesh-Event": delivery.event_type,
    "user-agent": "Nesh-Webhook/1.0",
  };
  if (delivery.attempts > 1) {
    requestHeaders["X-Nesh-Attempt"] = String(delivery.attempts);
  }

  const ok =
    delivery.status_code !== null && delivery.status_code >= 200 && delivery.status_code < 300;
  const retrying = delivery.next_attempt_at !== null;
  const statusTone = ok ? "text-green-600" : retrying ? "text-amber-600" : "text-destructive";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Delivery detail</h1>
          <p className="text-sm text-muted-foreground">
            {webhook.name ?? webhook.url} · {new Date(delivery.created_at).toLocaleString()}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${project.id}`}>← Back to project</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
          <span className="text-muted-foreground">Event</span>
          <code className="text-xs">{delivery.event_type}</code>

          <span className="text-muted-foreground">Status</span>
          <span className={statusTone}>
            {delivery.status_code ?? "network error"}
            {delivery.error ? ` · ${delivery.error}` : ""}
          </span>

          <span className="text-muted-foreground">Attempts</span>
          <span>{delivery.attempts}</span>

          <span className="text-muted-foreground">Next retry</span>
          <span>
            {delivery.next_attempt_at ? new Date(delivery.next_attempt_at).toLocaleString() : "—"}
          </span>

          <span className="text-muted-foreground">URL</span>
          <code className="break-all text-xs">{webhook.url}</code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="rounded bg-muted/30 p-3 font-mono text-xs">
            <div>POST {webhook.url}</div>
            {Object.entries(requestHeaders).map(([k, v]) => (
              <div key={k} className="break-all">
                <span className="text-muted-foreground">{k}:</span> {v}
              </div>
            ))}
          </div>
          <pre className="overflow-x-auto rounded bg-muted/30 p-3 text-xs">{body}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response</CardTitle>
        </CardHeader>
        <CardContent>
          {delivery.response_body ? (
            <pre className="overflow-x-auto rounded bg-muted/30 p-3 text-xs">
              {delivery.response_body}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              {delivery.error ?? "(no response body)"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
