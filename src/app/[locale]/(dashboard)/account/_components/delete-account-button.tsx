"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/[locale]/(auth)/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { email: string };

const CONFIRM_PHRASE = "delete my account";

export function DeleteAccountButton({ email }: Props) {
  const t = useTranslations("dashboard.deleteAccount");
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        {t("open")}
      </Button>
    );
  }

  const ready = confirmation.trim().toLowerCase() === CONFIRM_PHRASE;

  return (
    <div className="flex flex-col gap-3 rounded border border-destructive/50 bg-destructive/5 p-4">
      <p className="text-sm">
        {t.rich("warning", {
          email: () => <strong>{email}</strong>,
        })}
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">
          {t.rich("typeToConfirm", {
            phrase: () => (
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{CONFIRM_PHRASE}</code>
            ),
          })}
        </Label>
        <Input
          id="confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={!ready || pending}
          onClick={() => {
            startTransition(async () => {
              await deleteAccount();
            });
          }}
        >
          {pending ? t("deleting") : t("confirmDelete")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setConfirmation("");
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
