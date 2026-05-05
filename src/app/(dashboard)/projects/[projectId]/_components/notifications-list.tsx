import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DeleteNotificationButton } from "./delete-notification-button";

type Props = { projectId: string };

export async function NotificationsList({ projectId }: Props) {
  const supabase = await createClient();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(
      "id, title, body, url, scheduled_at, status, created_at, delivered, removed, failed, target_user_ids",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
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
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{n.body}</span>
                  <span className="text-xs text-muted-foreground">
                    {n.scheduled_at
                      ? `Scheduled for ${new Date(n.scheduled_at).toLocaleString()}`
                      : `Sent ${new Date(n.created_at).toLocaleString()}`}
                  </span>
                  {n.target_user_ids && n.target_user_ids.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Targeted: {n.target_user_ids.length} user
                      {n.target_user_ids.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {n.status === "sent" ? (
                    <span className="text-xs text-muted-foreground">
                      {n.delivered} delivered
                      {n.removed > 0 ? ` · ${n.removed} removed` : ""}
                      {n.failed > 0 ? ` · ${n.failed} failed` : ""}
                    </span>
                  ) : null}
                </div>
                <DeleteNotificationButton
                  projectId={projectId}
                  notificationId={n.id}
                  status={n.status as "pending" | "sent"}
                />
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
}: {
  status: "pending" | "sent";
  scheduled: string | null;
}) {
  const tone =
    status === "sent"
      ? "bg-green-100 text-green-800"
      : scheduled
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800";
  const label = status === "sent" ? "sent" : scheduled ? "scheduled" : "pending";
  return <span className={`rounded px-2 py-0.5 text-xs ${tone}`}>{label}</span>;
}
