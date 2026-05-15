import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { projectId: string };

export async function ExportCard({ projectId }: Props) {
  const t = await getTranslations("dashboard.exportCard");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">{t("desc")}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/projects/${projectId}/export/subscribers`} download>
              {t("subscribers")}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/projects/${projectId}/export/notifications`} download>
              {t("notifications")}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
