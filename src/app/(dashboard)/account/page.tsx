import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "./_components/change-password-form";
import { DeleteAccountButton } from "./_components/delete-account-button";

export default async function AccountPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div>
            <span className="text-muted-foreground">Email: </span>
            <span>{user.email}</span>
          </div>
          <div className="mt-1">
            <span className="text-muted-foreground">User ID: </span>
            <code className="text-xs">{user.id}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton email={user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
