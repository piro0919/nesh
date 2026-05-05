import { type NextRequest, NextResponse } from "next/server";
import { subscriptionSchema } from "@/lib/subscription-schema";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ projectId: string }> };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
