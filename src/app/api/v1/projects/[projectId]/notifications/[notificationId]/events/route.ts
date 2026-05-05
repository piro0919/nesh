import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/get-client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ projectId: string; notificationId: string }> };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const eventSchema = z.object({
  type: z.enum(["shown", "clicked"]),
});

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId, notificationId } = await params;

  // Per-IP cap to prevent inflating someone else's metrics. Loose: 600/min.
  const ip = getClientIp(request);
  const limited = await checkRateLimit({
    key: `events:${projectId}:${ip}`,
    limit: 600,
    windowSeconds: 60,
  });
  if (!limited.ok) {
    return new NextResponse(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", issues: parsed.error.issues }, 400);
  }

  const supabase = createAdminClient();
  const column = parsed.data.type === "shown" ? "shown" : "clicked";

  // Atomic increment via raw SQL through RPC-like update.
  // We scope the update by both project + notification id so a forged notification id
  // pointing at another project is rejected (no row matches → 0 affected → silent).
  const { error } = await supabase.rpc("increment_notification_event", {
    p_notification_id: notificationId,
    p_project_id: projectId,
    p_column: column,
  });

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ ok: true }, 200);
}
