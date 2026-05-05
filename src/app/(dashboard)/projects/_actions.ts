"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  redirect(`/projects/${project.id}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
  revalidatePath("/projects");
  redirect("/projects");
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
