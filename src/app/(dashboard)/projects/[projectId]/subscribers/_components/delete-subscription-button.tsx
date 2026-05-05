"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteSubscription } from "../_actions";

type Props = { projectId: string; subscriptionId: string };

export function DeleteSubscriptionButton({ projectId, subscriptionId }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remove this subscription? The browser will stop receiving notifications.")) {
          return;
        }
        startTransition(async () => {
          await deleteSubscription(projectId, subscriptionId);
        });
      }}
    >
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}
