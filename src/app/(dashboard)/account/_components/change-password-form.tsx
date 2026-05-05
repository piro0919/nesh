"use client";

import { useActionState } from "react";
import { type AccountState, changePassword } from "@/app/(auth)/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<AccountState, FormData>(
    changePassword,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="At least 8 characters"
        />
      </div>
      {state && "error" in state ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state && "ok" in state ? <p className="text-sm text-green-600">{state.ok}</p> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
