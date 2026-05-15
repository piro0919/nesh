import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "./_components/landing-page";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const locale = await getLocale();
    redirect({ href: "/projects", locale });
  }
  return <LandingPage />;
}
