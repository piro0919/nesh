import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExportCard } from "../_components/export-card";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Export</h1>
      <ExportCard projectId={project.id} />
    </div>
  );
}
