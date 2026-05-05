import { createHmac, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type SendResult = { sent: number; removed: number; failed: number };

export type NotificationSentPayload = {
  type: "notification.sent";
  notification: {
    id: string;
    project_id: string;
    title: string;
    body: string;
    url: string | null;
    delivered: number;
    removed: number;
    failed: number;
    target_user_ids: string[] | null;
    sent_at: string;
  };
};

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function signPayload(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

const TIMEOUT_MS = 5_000;

/**
 * Fire-and-best-effort webhook delivery. Records last_delivery_* on the
 * webhook row regardless of outcome. Caller awaits at most TIMEOUT_MS.
 */
export async function deliverWebhook(
  projectId: string,
  payload: NotificationSentPayload,
): Promise<void> {
  const supabase = createAdminClient();
  const { data: hook, error } = await supabase
    .from("webhooks")
    .select("id, url, secret, enabled")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error || !hook || !hook.enabled) return;

  const body = JSON.stringify(payload);
  const signature = signPayload(body, hook.secret);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let status: number | null = null;
  let errorMessage: string | null = null;
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Nesh-Signature": signature,
        "X-Nesh-Event": payload.type,
        "user-agent": "Nesh-Webhook/1.0",
      },
      body,
      signal: controller.signal,
    });
    status = res.status;
    if (!res.ok) {
      errorMessage = `HTTP ${res.status}`;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  } finally {
    clearTimeout(t);
  }

  await supabase
    .from("webhooks")
    .update({
      last_delivery_at: new Date().toISOString(),
      last_delivery_status: status,
      last_delivery_error: errorMessage,
    })
    .eq("id", hook.id);
}

/**
 * Convenience wrapper called after sendToProject succeeds. Fetches the
 * notification metadata, builds the payload, and fires the webhook.
 * Errors are swallowed — webhook delivery must never break the send flow.
 */
export async function fireSentWebhook(
  projectId: string,
  notificationId: string,
  result: SendResult,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: n } = await supabase
      .from("notifications")
      .select("id, project_id, title, body, url, target_user_ids")
      .eq("id", notificationId)
      .maybeSingle();
    if (!n) return;
    await deliverWebhook(projectId, {
      type: "notification.sent",
      notification: {
        id: n.id,
        project_id: n.project_id,
        title: n.title,
        body: n.body,
        url: n.url,
        delivered: result.sent,
        removed: result.removed,
        failed: result.failed,
        target_user_ids: n.target_user_ids,
        sent_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[webhook] fireSentWebhook failed", err);
  }
}
