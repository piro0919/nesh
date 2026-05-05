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

// Exponential backoff schedule (in milliseconds) used after a retryable
// failure. Index = current attempt count (1-based). After MAX_ATTEMPTS
// total attempts the row goes terminal (next_attempt_at = NULL).
const BACKOFF_MS = [
  30_000, // after 1st failed attempt → retry in 30s
  120_000, // after 2nd → 2m
  600_000, // after 3rd → 10m
  3_600_000, // after 4th → 1h
];
export const MAX_ATTEMPTS = BACKOFF_MS.length + 1; // 5

function isRetryable(status: number | null): boolean {
  // Network failures (status === null) and 5xx / 408 / 429 are transient.
  // Other 4xx are caller errors — don't retry.
  if (status === null) return true;
  if (status === 408 || status === 429) return true;
  return status >= 500 && status < 600;
}

function nextAttemptAt(attempt: number): string | null {
  const delay = BACKOFF_MS[attempt - 1];
  return delay === undefined ? null : new Date(Date.now() + delay).toISOString();
}

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

  const succeeded = status !== null && status >= 200 && status < 300;
  const retryEligible = !succeeded && isRetryable(status);
  const next_attempt_at = retryEligible ? nextAttemptAt(1) : null;

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
      attempts: 1,
      next_attempt_at,
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
 * Cron entrypoint. Picks up delivery rows whose next_attempt_at is due,
 * re-fires the saved payload against the webhook's current url/secret,
 * and updates the row in place with the new attempt count + status +
 * the next backoff (or NULL when terminal).
 */
export async function retryDueWebhooks(limit = 50): Promise<{ retried: number }> {
  const supabase = createAdminClient();
  const { data: due, error } = await supabase
    .from("webhook_deliveries")
    .select("id, webhook_id, event_type, payload, attempts")
    .not("next_attempt_at", "is", null)
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[webhook] retryDueWebhooks lookup failed", error);
    return { retried: 0 };
  }

  let retried = 0;
  for (const row of due ?? []) {
    // Claim the row immediately so a concurrent cron tick can't pick it up too.
    // Setting next_attempt_at = null here is a "lock"; we'll restore it below
    // if the retry itself fails again.
    const { error: claimError } = await supabase
      .from("webhook_deliveries")
      .update({ next_attempt_at: null })
      .eq("id", row.id)
      .not("next_attempt_at", "is", null);
    if (claimError) continue;

    const { data: hook } = await supabase
      .from("webhooks")
      .select("id, url, secret, enabled")
      .eq("id", row.webhook_id)
      .maybeSingle();
    if (!hook?.enabled) continue;

    const attempt = row.attempts + 1;
    const body = JSON.stringify(row.payload);
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
          "X-Nesh-Event": row.event_type,
          "X-Nesh-Attempt": String(attempt),
          "user-agent": "Nesh-Webhook/1.0",
        },
        body,
        signal: controller.signal,
      });
      status = res.status;
      if (!res.ok) errorMessage = `HTTP ${res.status}`;
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    } finally {
      clearTimeout(t);
    }

    const succeeded = status !== null && status >= 200 && status < 300;
    const retryEligible = !succeeded && isRetryable(status);
    const next_attempt_at = retryEligible ? nextAttemptAt(attempt) : null;

    await Promise.all([
      supabase
        .from("webhooks")
        .update({
          last_delivery_at: new Date().toISOString(),
          last_delivery_status: status,
          last_delivery_error: errorMessage,
        })
        .eq("id", hook.id),
      supabase
        .from("webhook_deliveries")
        .update({
          status_code: status,
          error: errorMessage,
          attempts: attempt,
          next_attempt_at,
        })
        .eq("id", row.id),
    ]);

    retried++;
  }

  return { retried };
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
