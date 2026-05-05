"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/(auth)/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { email: string };

const CONFIRM_PHRASE = "delete my account";

export function DeleteAccountButton({ email }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        Delete account…
      </Button>
    );
  }

  const ready = confirmation.trim().toLowerCase() === CONFIRM_PHRASE;

  return (
    <div className="flex flex-col gap-3 rounded border border-destructive/50 bg-destructive/5 p-4">
      <p className="text-sm">
        This will permanently delete <strong>{email}</strong>, every project you own, and every
        subscriber attached to those projects. This cannot be undone.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">
          Type <code className="rounded bg-muted px-1 py-0.5 text-xs">{CONFIRM_PHRASE}</code> to
          confirm
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
          {pending ? "Deleting…" : "Delete account permanently"}
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
          Cancel
        </Button>
      </div>
    </div>
  );
}
