import { type NextRequest, NextResponse } from "next/server";
import { sendToProject } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";

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
      results.push({ id: row.id, status: "sent" });
    } catch (sendError) {
      results.push({
        id: row.id,
        status: "failed",
        error: sendError instanceof Error ? sendError.message : "unknown",
      });
    }
  }

  // Cleanup rate_limits older than 24h (best-effort; failure does not block dispatch)
  try {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    await supabase.from("rate_limits").delete().lt("window_start", cutoff);
  } catch (cleanupError) {
    console.error("[cron] rate_limits cleanup failed", cleanupError);
  }

  return NextResponse.json({ processed: results.length, results });
}

export const GET = POST;
