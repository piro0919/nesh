"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteSubscription(projectId: string, subscriptionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", subscriptionId)
    .eq("project_id", projectId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}/subscribers`);
  revalidatePath(`/projects/${projectId}`);
}
