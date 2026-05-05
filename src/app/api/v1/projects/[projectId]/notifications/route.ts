import { type NextRequest, NextResponse } from "next/server";
import { FREE_TIER, startOfCurrentMonthUtc } from "@/lib/limits";
import { notificationPayloadSchema } from "@/lib/push/payload";
import { sendToProject } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ projectId: string }> };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing Authorization Bearer token" }, 401);
  }
  const apiKey = auth.slice("Bearer ".length).trim();
  if (!apiKey) {
    return jsonResponse({ error: "Empty API key" }, 401);
  }

  const supabase = createAdminClient();

  // Validate API key against project. Single round-trip with both filters.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, api_key")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) return jsonResponse({ error: projectError.message }, 500);
  if (!project || project.api_key !== apiKey) {
    return jsonResponse({ error: "Invalid project or API key" }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const parsed = notificationPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", issues: parsed.error.issues }, 400);
  }

  // Monthly cap (matches dashboard create flow)
  const { count: monthCount, error: countError } = await supabase
    .from("notifications")
    .select("*", { head: true, count: "exact" })
    .eq("project_id", projectId)
    .gte("created_at", startOfCurrentMonthUtc().toISOString());

  if (countError) return jsonResponse({ error: countError.message }, 500);
  if ((monthCount ?? 0) >= FREE_TIER.NOTIFICATIONS_PER_MONTH) {
    return jsonResponse(
      {
        error: `Monthly send limit reached (${FREE_TIER.NOTIFICATIONS_PER_MONTH.toLocaleString()})`,
      },
      429,
    );
  }

  const targetUserIds =
    parsed.data.userIds && parsed.data.userIds.length > 0
      ? Array.from(new Set(parsed.data.userIds))
      : null;

  const { data: notification, error: insertError } = await supabase
    .from("notifications")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url ?? null,
      status: "pending",
      target_user_ids: targetUserIds,
    })
    .select("id")
    .single();

  if (insertError) return jsonResponse({ error: insertError.message }, 500);

  try {
    const result = await sendToProject(projectId, notification.id);
    await supabase
      .from("notifications")
      .update({
        status: "sent",
        delivered: result.sent,
        removed: result.removed,
        failed: result.failed,
      })
      .eq("id", notification.id);

    return jsonResponse(
      {
        id: notification.id,
        attempted: result.attempted,
        delivered: result.sent,
        removed: result.removed,
        failed: result.failed,
      },
      201,
    );
  } catch (sendError) {
    return jsonResponse(
      {
        id: notification.id,
        error: sendError instanceof Error ? sendError.message : "Send failed",
      },
      500,
    );
  }
}
