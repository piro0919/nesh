import webpush from "web-push";
import { decryptString, isEncrypted } from "@/lib/crypto";
import { logError } from "@/lib/error-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { fireSubscriptionRemoved } from "@/lib/webhooks";

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
    .select("vapid_public_key, vapid_private_key, vapid_subject, default_icon, default_badge")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new Error("Project not found");

  const { data: notification, error: notificationError } = await supabase
    .from("notifications")
    .select("title, body, url, icon, image, badge, target_user_ids")
    .eq("id", notificationId)
    .maybeSingle();
  if (notificationError) throw notificationError;
  if (!notification) throw new Error("Notification not found");

  let query = supabase
    .from("subscriptions")
    .select("id, endpoint, p256dh, auth, external_user_id")
    .eq("project_id", projectId);
  if (notification.target_user_ids && notification.target_user_ids.length > 0) {
    query = query.in("external_user_id", notification.target_user_ids);
  }
  const { data: subscriptions, error: subsError } = await query;
  if (subsError) throw subsError;

  const privateKey = isEncrypted(project.vapid_private_key)
    ? await decryptString(project.vapid_private_key)
    : project.vapid_private_key;

  // Pass VAPID per-call instead of webpush.setVapidDetails() (global mutable state)
  // so concurrent sends across different projects don't trample each other's keys.
  const vapidDetails = {
    subject: project.vapid_subject,
    publicKey: project.vapid_public_key,
    privateKey,
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nesh.kkweb.io";
  const eventBase = `${siteUrl}/api/v1/projects/${projectId}/notifications/${notificationId}/events`;
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url ?? undefined,
    icon: notification.icon ?? project.default_icon ?? undefined,
    image: notification.image ?? undefined,
    badge: notification.badge ?? project.default_badge ?? undefined,
    // _nesh metadata is consumed by next-push >= 0.6 to fire tracking beacons.
    // Older SDK versions ignore unknown keys.
    _nesh: {
      track: {
        shown: eventBase,
        click: eventBase,
      },
    },
  });

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const sub of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { vapidDetails },
      );
      sent++;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("subscriptions").delete().eq("id", sub.id);
        await fireSubscriptionRemoved(
          projectId,
          { endpoint: sub.endpoint, external_user_id: sub.external_user_id },
          "expired",
        );
        removed++;
      } else {
        failed++;
        await logError("push.send", error, {
          projectId,
          metadata: { subscriptionId: sub.id, notificationId },
        });
      }
    }
  }

  return { attempted: subscriptions?.length ?? 0, sent, removed, failed };
}
