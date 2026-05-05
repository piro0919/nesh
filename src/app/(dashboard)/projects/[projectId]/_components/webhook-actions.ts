"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deliverWebhook, generateWebhookSecret } from "@/lib/webhooks";

export type WebhookFormState = { error: string } | { ok: string } | undefined;

function isValidWebhookUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function saveWebhook(
  projectId: string,
  _prev: WebhookFormState,
  formData: FormData,
): Promise<WebhookFormState> {
  const url = String(formData.get("url") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!url) return { error: "URL is required" };
  if (url.length > 2048) return { error: "URL too long" };
  if (!isValidWebhookUrl(url)) return { error: "URL must be http(s)" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("webhooks")
    .select("id, secret")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("webhooks")
      .update({ url, enabled })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("webhooks")
      .insert({ project_id: projectId, url, enabled, secret: generateWebhookSecret() });
    if (error) return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: "Saved." };
}

export async function rotateWebhookSecret(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("webhooks")
    .update({ secret: generateWebhookSecret() })
    .eq("project_id", projectId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteWebhook(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("webhooks").delete().eq("project_id", projectId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export async function testWebhook(projectId: string): Promise<WebhookFormState> {
  await deliverWebhook(projectId, {
    type: "notification.sent",
    notification: {
      id: "test_00000000",
      project_id: projectId,
      title: "Test from Nesh",
      body: "This is a test delivery from your dashboard.",
      url: null,
      delivered: 0,
      removed: 0,
      failed: 0,
      target_user_ids: null,
      sent_at: new Date().toISOString(),
    },
  });
  revalidatePath(`/projects/${projectId}`);
  return { ok: "Test delivery sent." };
}
