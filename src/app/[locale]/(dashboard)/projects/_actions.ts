"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { encryptString } from "@/lib/crypto";
import { FREE_TIER } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";
import { generateVapidKeys } from "@/lib/vapid";

function generateApiKey(): string {
  return `nesh_sk_${randomBytes(24).toString("base64url")}`;
}

export type CreateProjectState = { error: string } | undefined;

export async function createProject(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Not authenticated" };

  const { count: existingCount, error: countError } = await supabase
    .from("projects")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", userData.user.id);
  if (countError) return { error: countError.message };
  if ((existingCount ?? 0) >= FREE_TIER.PROJECTS_PER_USER) {
    return {
      error: `Free tier allows ${FREE_TIER.PROJECTS_PER_USER} project per account. Delete the existing one to create a new project.`,
    };
  }

  const { publicKey, privateKey } = generateVapidKeys();
  const encryptedPrivateKey = await encryptString(privateKey);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: userData.user.id,
      name,
      vapid_public_key: publicKey,
      vapid_private_key: encryptedPrivateKey,
      vapid_subject: `mailto:${userData.user.email ?? "noreply@nesh.local"}`,
      api_key: generateApiKey(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/projects");
  redirect({ href: `/projects/${project.id}`, locale: await getLocale() });
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
  revalidatePath("/projects");
  redirect({ href: "/projects", locale: await getLocale() });
}

export type RenameProjectState = { error: string } | { ok: true } | undefined;

export async function renameProject(
  projectId: string,
  _prev: RenameProjectState,
  formData: FormData,
): Promise<RenameProjectState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };
  if (name.length > 100) return { error: "Name too long (max 100)" };

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ name }).eq("id", projectId);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { ok: true };
}

export async function regenerateApiKey(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ api_key: generateApiKey() })
    .eq("id", projectId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export type UpdateDefaultsState = { error: string } | { ok: true } | undefined;

const MAX_URL_LENGTH = 2048;

function sanitizeUrl(value: string): string | null | { error: string } {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed.length > MAX_URL_LENGTH) return { error: "URL too long" };
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return { error: "Invalid URL" };
    return trimmed;
  } catch {
    return { error: "Invalid URL" };
  }
}

export async function updateProjectDefaults(
  projectId: string,
  _prev: UpdateDefaultsState,
  formData: FormData,
): Promise<UpdateDefaultsState> {
  const iconResult = sanitizeUrl(String(formData.get("default_icon") ?? ""));
  if (typeof iconResult === "object" && iconResult && "error" in iconResult) {
    return { error: `Icon URL: ${iconResult.error}` };
  }
  const badgeResult = sanitizeUrl(String(formData.get("default_badge") ?? ""));
  if (typeof badgeResult === "object" && badgeResult && "error" in badgeResult) {
    return { error: `Badge URL: ${badgeResult.error}` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      default_icon: iconResult as string | null,
      default_badge: badgeResult as string | null,
    })
    .eq("id", projectId);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
