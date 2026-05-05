import { type NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/error-log";
import { sendToProject } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { fireSentWebhook, retryDueWebhooks } from "@/lib/webhooks";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("notifications")
    .select("id, project_id")
    .eq("status", "pending")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", nowIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    id: string;
    status: "sent" | "failed";
    error?: string;
  }> = [];

  for (const row of due ?? []) {
    try {
      const sendResult = await sendToProject(row.project_id, row.id);
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          status: "sent",
          delivered: sendResult.sent,
          removed: sendResult.removed,
          failed: sendResult.failed,
        })
        .eq("id", row.id);
      if (updateError) throw updateError;
      await fireSentWebhook(row.project_id, row.id, sendResult);
      results.push({ id: row.id, status: "sent" });
    } catch (sendError) {
      results.push({
        id: row.id,
        status: "failed",
        error: sendError instanceof Error ? sendError.message : "unknown",
      });
    }
  }

  // Retry any webhook deliveries whose backoff window has elapsed.
  let webhooksRetried = 0;
  try {
    const r = await retryDueWebhooks();
    webhooksRetried = r.retried;
  } catch (retryError) {
    await logError("cron.webhook_retry", retryError);
  }

  // Cleanup rate_limits older than 24h (best-effort; failure does not block dispatch)
  try {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    await supabase.from("rate_limits").delete().lt("window_start", cutoff);
  } catch (cleanupError) {
    await logError("cron.rate_limits_cleanup", cleanupError);
  }

  return NextResponse.json({ processed: results.length, webhooksRetried, results });
}

export const GET = POST;
