import { BellPlus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteNotificationButton } from "./delete-notification-button";

type Notification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  icon: string | null;
  image: string | null;
  badge: string | null;
  target_user_ids: string[] | null;
};

function resendQuery(projectId: string, n: Notification): string {
  const params = new URLSearchParams();
  params.set("title", n.title);
  params.set("body", n.body);
  if (n.url) params.set("url", n.url);
  if (n.icon) params.set("icon", n.icon);
  if (n.image) params.set("image", n.image);
  if (n.badge) params.set("badge", n.badge);
  if (n.target_user_ids?.length) params.set("target_user_ids", n.target_user_ids.join(", "));
  return `/projects/${projectId}/notifications/new?${params.toString()}`;
}

type Props = { projectId: string };

export async function NotificationsList({ projectId }: Props) {
  const t = await getTranslations("dashboard.notificationsList");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(
      "id, title, body, url, icon, image, badge, scheduled_at, status, created_at, delivered, removed, failed, shown, clicked, target_user_ids",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <EmptyState
            icon={BellPlus}
            title={t("empty")}
            description={t("emptyDesc")}
            action={
              <Button asChild size="sm">
                <Link href={`/projects/${projectId}/notifications/new`}>{t("emptyCta")}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    <StatusBadge
                      status={n.status as "pending" | "sent"}
                      scheduled={n.scheduled_at}
                      labels={{
                        sent: t("status.sent"),
                        scheduled: t("status.scheduled"),
                        pending: t("status.pending"),
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{n.body}</span>
                  <span className="text-xs text-muted-foreground">
                    {n.scheduled_at
                      ? t("scheduledFor", {
                          date: new Date(n.scheduled_at).toLocaleString(locale),
                        })
                      : t("sentAt", { date: new Date(n.created_at).toLocaleString(locale) })}
                  </span>
                  {n.target_user_ids && n.target_user_ids.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {t("targeted", { count: n.target_user_ids.length })}
                    </span>
                  ) : null}
                  {n.status === "sent" ? (
                    <span className="text-xs text-muted-foreground">
                      {t("stats", {
                        delivered: n.delivered,
                        shown: n.shown,
                        clicked: n.clicked,
                      })}
                      {n.removed > 0 ? ` · ${t("removed", { count: n.removed })}` : ""}
                      {n.failed > 0 ? ` · ${t("failed", { count: n.failed })}` : ""}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {n.status === "sent" ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={resendQuery(projectId, n)}>{t("resend")}</Link>
                    </Button>
                  ) : null}
                  <DeleteNotificationButton
                    projectId={projectId}
                    notificationId={n.id}
                    status={n.status as "pending" | "sent"}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
  scheduled,
  labels,
}: {
  status: "pending" | "sent";
  scheduled: string | null;
  labels: { sent: string; scheduled: string; pending: string };
}) {
  const tone =
    status === "sent"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : scheduled
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-muted text-muted-foreground";
  const label = status === "sent" ? labels.sent : scheduled ? labels.scheduled : labels.pending;
  return <span className={`rounded px-2 py-0.5 text-xs ${tone}`}>{label}</span>;
}
