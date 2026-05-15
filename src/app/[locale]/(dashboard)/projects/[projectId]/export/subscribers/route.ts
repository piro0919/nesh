import { notFound } from "next/navigation";
import { csvResponse, toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const supabase = await createClient();

  // RLS limits the project select to the authenticated owner.
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, endpoint, p256dh, auth, external_user_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const csv = toCsv(data ?? [], [
    "id",
    "endpoint",
    "p256dh",
    "auth",
    "external_user_id",
    "created_at",
  ]);
  const slug = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(`nesh-${slug || "project"}-subscribers-${date}.csv`, csv);
}
