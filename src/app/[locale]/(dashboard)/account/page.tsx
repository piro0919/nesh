import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "./_components/change-password-form";
import { DeleteAccountButton } from "./_components/delete-account-button";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("dashboard.account");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader title={t("title")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div>
            <span className="text-muted-foreground">{t("email")}: </span>
            <span>{user.email}</span>
          </div>
          <div className="mt-1">
            <span className="text-muted-foreground">{t("userId")}: </span>
            <code className="text-xs">{user.id}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">{t("dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton email={user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
