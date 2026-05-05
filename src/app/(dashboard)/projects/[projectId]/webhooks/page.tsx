import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WebhooksCard } from "../_components/webhook-card";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data: webhooks } = await supabase
    .from("webhooks")
    .select(
      "id, name, url, secret, enabled, events, last_delivery_at, last_delivery_status, last_delivery_error",
    )
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const webhookIds = (webhooks ?? []).map((w) => w.id);
  const { data: deliveries } =
    webhookIds.length > 0
      ? await supabase
          .from("webhook_deliveries")
          .select(
            "id, webhook_id, event_type, status_code, error, created_at, attempts, next_attempt_at",
          )
          .in("webhook_id", webhookIds)
          .order("created_at", { ascending: false })
          .limit(200)
      : {
          data: [] as Array<{
            id: string;
            webhook_id: string;
            event_type: string;
            status_code: number | null;
            error: string | null;
            created_at: string;
            attempts: number;
            next_attempt_at: string | null;
          }>,
        };

  const deliveriesByWebhook: Record<string, NonNullable<typeof deliveries>> = {};
  for (const d of deliveries ?? []) {
    if (!deliveriesByWebhook[d.webhook_id]) deliveriesByWebhook[d.webhook_id] = [];
    deliveriesByWebhook[d.webhook_id].push(d);
  }
  for (const k of Object.keys(deliveriesByWebhook)) {
    deliveriesByWebhook[k] = deliveriesByWebhook[k].slice(0, 20);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Webhooks</h1>
      <WebhooksCard
        projectId={project.id}
        webhooks={webhooks ?? []}
        deliveriesByWebhook={deliveriesByWebhook}
      />
    </div>
  );
}
