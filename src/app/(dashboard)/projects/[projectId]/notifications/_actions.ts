"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const scheduledAtRaw = String(formData.get("scheduled_at") ?? "").trim();
  const mode = String(formData.get("mode") ?? "immediate");

  const parsed = notificationPayloadSchema.safeParse({
    title,
    body,
    url: urlRaw === "" ? null : urlRaw,
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
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url ?? null,
      scheduled_at: scheduledAt,
      status: "pending",
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
