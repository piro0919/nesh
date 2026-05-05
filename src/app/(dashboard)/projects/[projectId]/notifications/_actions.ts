"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FREE_TIER, startOfCurrentMonthUtc } from "@/lib/limits";
import { notificationPayloadSchema } from "@/lib/push/payload";
import { sendToProject } from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";

export type CreateNotificationState = { error: string } | undefined;

export async function createNotification(
  projectId: string,
  _prev: CreateNotificationState,
  formData: FormData,
): Promise<CreateNotificationState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const urlRaw = String(formData.get("url") ?? "").trim();
  const iconRaw = String(formData.get("icon") ?? "").trim();
  const imageRaw = String(formData.get("image") ?? "").trim();
  const badgeRaw = String(formData.get("badge") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduled_at") ?? "").trim();
  const mode = String(formData.get("mode") ?? "immediate");
  const targetRaw = String(formData.get("target_user_ids") ?? "").trim();
  const targetUserIds =
    targetRaw === ""
      ? null
      : Array.from(
          new Set(
            targetRaw
              .split(/[\s,]+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0 && s.length <= 256),
          ),
        );
  if (targetUserIds && targetUserIds.length > 1000) {
    return { error: "Too many target user ids (max 1,000)" };
  }

  const parsed = notificationPayloadSchema.safeParse({
    title,
    body,
    url: urlRaw === "" ? null : urlRaw,
    icon: iconRaw === "" ? null : iconRaw,
    image: imageRaw === "" ? null : imageRaw,
    badge: badgeRaw === "" ? null : badgeRaw,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  let scheduledAt: string | null = null;
  if (mode === "scheduled") {
    if (!scheduledAtRaw) return { error: "Scheduled time is required" };
    const dt = new Date(scheduledAtRaw);
    if (Number.isNaN(dt.getTime())) return { error: "Invalid scheduled time" };
    if (dt.getTime() <= Date.now()) return { error: "Scheduled time must be in the future" };
    scheduledAt = dt.toISOString();
  }

  const supabase = await createClient();

  const { count: monthCount, error: countError } = await supabase
    .from("notifications")
    .select("*", { head: true, count: "exact" })
    .eq("project_id", projectId)
    .gte("created_at", startOfCurrentMonthUtc().toISOString());
  if (countError) return { error: countError.message };
  if ((monthCount ?? 0) >= FREE_TIER.NOTIFICATIONS_PER_MONTH) {
    return {
      error: `Monthly send limit reached (${FREE_TIER.NOTIFICATIONS_PER_MONTH.toLocaleString()} notifications). Resets at the start of next month (UTC).`,
    };
  }

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url ?? null,
      icon: parsed.data.icon ?? null,
      image: parsed.data.image ?? null,
      badge: parsed.data.badge ?? null,
      scheduled_at: scheduledAt,
      status: "pending",
      target_user_ids: targetUserIds,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (mode === "immediate") {
    try {
      const result = await sendToProject(projectId, notification.id);
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          status: "sent",
          delivered: result.sent,
          removed: result.removed,
          failed: result.failed,
        })
        .eq("id", notification.id);
      if (updateError) return { error: updateError.message };
    } catch (sendError) {
      return { error: sendError instanceof Error ? sendError.message : "Send failed" };
    }
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function deleteNotification(projectId: string, notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}
