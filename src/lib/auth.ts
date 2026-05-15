import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user) {
    redirect({ href: "/sign-in", locale: await getLocale() });
    // unreachable — redirect throws, but TS doesn't always infer `never` from next-intl
    throw new Error("unreachable");
  }
  return user;
}
