import { notFound } from "next/navigation";
import { csvResponse, toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, title, body, url, icon, image, badge, status, scheduled_at, target_user_ids, delivered, removed, failed, shown, clicked, created_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) {
    return new Response(error.message, { status: 500 });
  }

  // target_user_ids is an array — flatten to a pipe-separated string for CSV.
  const rows = (data ?? []).map((n) => ({
    ...n,
    target_user_ids: n.target_user_ids ? n.target_user_ids.join("|") : "",
  }));

  const csv = toCsv(rows, [
    "id",
    "created_at",
    "status",
    "scheduled_at",
    "title",
    "body",
    "url",
    "icon",
    "image",
    "badge",
    "target_user_ids",
    "delivered",
    "removed",
    "failed",
    "shown",
    "clicked",
  ]);
  const slug = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(`nesh-${slug || "project"}-notifications-${date}.csv`, csv);
}
