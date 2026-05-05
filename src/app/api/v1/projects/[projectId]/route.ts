import { type NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";
import { checkRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { subscriptionSchema } from "@/lib/subscription-schema";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ projectId: string }> };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const RATE_LIMIT_PER_MIN = 60;

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
  return new NextResponse(JSON.stringify({ error: "Rate limit exceeded" }), {
    status: 429,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
    },
  });
}

async function enforceRateLimit(
  request: NextRequest,
  projectId: string,
  action: "post" | "delete",
) {
  const ip = getClientIp(request);
  const result = await checkRateLimit({
    key: `subscriptions:${projectId}:${ip}:${action}`,
    limit: RATE_LIMIT_PER_MIN,
    windowSeconds: 60,
  });
  return result.ok ? null : rateLimitResponse(result);
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;

  const limited = await enforceRateLimit(request, projectId, "post");
  if (limited) return limited;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const parsed = subscriptionSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", issues: parsed.error.issues }, 400);
  }

  const supabase = createAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) return jsonResponse({ error: projectError.message }, 500);
  if (!project) return jsonResponse({ error: "Project not found" }, 404);

  const { endpoint, keys } = parsed.data;

  const { error: upsertError } = await supabase.from("subscriptions").upsert(
    {
      project_id: projectId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    { onConflict: "project_id,endpoint" },
  );

  if (upsertError) return jsonResponse({ error: upsertError.message }, 500);

  return jsonResponse({ ok: true }, 201);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { projectId } = await params;

  const limited = await enforceRateLimit(request, projectId, "delete");
  if (limited) return limited;

  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return jsonResponse({ error: "Missing endpoint query param" }, 400);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("project_id", projectId)
    .eq("endpoint", endpoint);

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ ok: true }, 200);
}
