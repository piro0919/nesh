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

type WebhookRow = {
  id: string;
  url: string;
  secret: string;
};

/**
 * Best-effort webhook delivery. Updates last_delivery_* on the row and
 * appends a row to webhook_deliveries regardless of outcome.
 */
async function deliverOne(hook: WebhookRow, payload: NotificationSentPayload): Promise<void> {
  const supabase = createAdminClient();
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

  // Run snapshot update + delivery log insert in parallel — they're independent.
  await Promise.all([
    supabase
      .from("webhooks")
      .update({
        last_delivery_at: new Date().toISOString(),
        last_delivery_status: status,
        last_delivery_error: errorMessage,
      })
      .eq("id", hook.id),
    supabase.from("webhook_deliveries").insert({
      webhook_id: hook.id,
      event_type: payload.type,
      status_code: status,
      error: errorMessage,
      payload,
    }),
  ]);
}

/**
 * Convenience wrapper called after sendToProject succeeds. Fans out to
 * every enabled webhook configured for the project. Errors are swallowed —
 * webhook delivery must never break the send flow.
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

    const { data: hooks } = await supabase
      .from("webhooks")
      .select("id, url, secret")
      .eq("project_id", projectId)
      .eq("enabled", true);
    if (!hooks || hooks.length === 0) return;

    const payload: NotificationSentPayload = {
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
    };

    await Promise.all(hooks.map((h) => deliverOne(h, payload)));
  } catch (err) {
    console.error("[webhook] fireSentWebhook failed", err);
  }
}

/**
 * Fire a one-off test delivery (used by the dashboard "Send test" button).
 */
export async function deliverTestWebhook(webhookId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: hook } = await supabase
    .from("webhooks")
    .select("id, url, secret, project_id")
    .eq("id", webhookId)
    .maybeSingle();
  if (!hook) return;

  await deliverOne(
    { id: hook.id, url: hook.url, secret: hook.secret },
    {
      type: "notification.sent",
      notification: {
        id: "test_00000000",
        project_id: hook.project_id,
        title: "Test from Nesh",
        body: "This is a test delivery from your dashboard.",
        url: null,
        delivered: 0,
        removed: 0,
        failed: 0,
        target_user_ids: null,
        sent_at: new Date().toISOString(),
      },
    },
  );
}
