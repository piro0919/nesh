"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | undefined;

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  redirect({ href: "/projects", locale: await getLocale() });
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect({ href: "/projects", locale: await getLocale() });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/sign-in", locale: await getLocale() });
}

export type AccountState = { error: string } | { ok: string } | undefined;

export async function changePassword(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: "Password updated." };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  const locale = await getLocale();
  const user = data.user;
  if (userError || !user) {
    redirect({ href: "/sign-in", locale });
    throw new Error("unreachable");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`Failed to delete account: ${error.message}`);
  }

  await supabase.auth.signOut();
  redirect({ href: "/sign-in", locale });
}
