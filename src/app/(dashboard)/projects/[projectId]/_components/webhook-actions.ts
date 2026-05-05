"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deliverTestWebhook, generateWebhookSecret } from "@/lib/webhooks";

export type WebhookFormState = { error: string } | { ok: string } | undefined;

function isValidWebhookUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function createWebhook(
  projectId: string,
  _prev: WebhookFormState,
  formData: FormData,
): Promise<WebhookFormState> {
  const url = String(formData.get("url") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!url) return { error: "URL is required" };
  if (url.length > 2048) return { error: "URL too long" };
  if (!isValidWebhookUrl(url)) return { error: "URL must be http(s)" };
  if (name.length > 100) return { error: "Name too long" };

  const supabase = await createClient();
  const { error } = await supabase.from("webhooks").insert({
    project_id: projectId,
    url,
    name: name || null,
    enabled: true,
    secret: generateWebhookSecret(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { ok: "Created." };
}

export async function updateWebhook(
  projectId: string,
  webhookId: string,
  _prev: WebhookFormState,
  formData: FormData,
): Promise<WebhookFormState> {
  const url = String(formData.get("url") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!url) return { error: "URL is required" };
  if (!isValidWebhookUrl(url)) return { error: "URL must be http(s)" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("webhooks")
    .update({ url, name: name || null, enabled })
    .eq("id", webhookId);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { ok: "Saved." };
}

export async function rotateWebhookSecret(projectId: string, webhookId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("webhooks")
    .update({ secret: generateWebhookSecret() })
    .eq("id", webhookId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteWebhook(projectId: string, webhookId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("webhooks").delete().eq("id", webhookId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export async function testWebhook(projectId: string, webhookId: string): Promise<WebhookFormState> {
  await deliverTestWebhook(webhookId);
  revalidatePath(`/projects/${projectId}`);
  return { ok: "Test delivery sent." };
}
