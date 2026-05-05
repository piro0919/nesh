import webpush from "web-push";
import { decryptString, isEncrypted } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type SendResult = {
  attempted: number;
  sent: number;
  removed: number;
  failed: number;
};

export async function sendToProject(
  projectId: string,
  notificationId: string,
): Promise<SendResult> {
  const supabase = createAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("vapid_public_key, vapid_private_key, vapid_subject")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new Error("Project not found");

  const { data: notification, error: notificationError } = await supabase
    .from("notifications")
    .select("title, body, url, target_user_ids")
    .eq("id", notificationId)
    .maybeSingle();
  if (notificationError) throw notificationError;
  if (!notification) throw new Error("Notification not found");

  let query = supabase
    .from("subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("project_id", projectId);
  if (notification.target_user_ids && notification.target_user_ids.length > 0) {
    query = query.in("external_user_id", notification.target_user_ids);
  }
  const { data: subscriptions, error: subsError } = await query;
  if (subsError) throw subsError;

  const privateKey = isEncrypted(project.vapid_private_key)
    ? await decryptString(project.vapid_private_key)
    : project.vapid_private_key;

  webpush.setVapidDetails(project.vapid_subject, project.vapid_public_key, privateKey);

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url ?? undefined,
  });

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const sub of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("subscriptions").delete().eq("id", sub.id);
        removed++;
      } else {
        failed++;
        console.error("[push] send failed", { subscriptionId: sub.id, error });
      }
    }
  }

  return { attempted: subscriptions?.length ?? 0, sent, removed, failed };
}
