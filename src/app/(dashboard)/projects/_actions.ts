"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { encryptString } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import { generateVapidKeys } from "@/lib/vapid";

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
