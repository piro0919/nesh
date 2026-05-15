import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { ApiKeyCard } from "../_components/api-key-card";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const t = await getTranslations("dashboard.apiPage");
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, api_key")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const apiBase = `${getSiteUrl()}/api/v1/projects/${project.id}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <ApiKeyCard projectId={project.id} apiKey={project.api_key} apiBase={apiBase} />
    </div>
  );
}
