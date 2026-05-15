"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type AccountState, changePassword } from "@/app/[locale]/(auth)/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const t = useTranslations("dashboard.changePassword");
  const [state, formAction, pending] = useActionState<AccountState, FormData>(
    changePassword,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">{t("newPassword")}</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          minLength={8}
          required
          placeholder={t("placeholder")}
        />
      </div>
      {state && "error" in state ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state && "ok" in state ? (
        <p className="text-sm text-green-600 dark:text-green-400">{state.ok}</p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("update")}
        </Button>
      </div>
    </form>
  );
}
