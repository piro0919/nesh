import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "../_components/notifications-list";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const t = await getTranslations("dashboard.notificationsPage");
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button asChild size="sm">
            <Link href={`/projects/${project.id}/notifications/new`}>{t("send")}</Link>
          </Button>
        }
      />
      <NotificationsList projectId={project.id} />
    </div>
  );
}
