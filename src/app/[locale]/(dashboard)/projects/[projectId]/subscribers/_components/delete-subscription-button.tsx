"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteSubscription } from "../_actions";

type Props = { projectId: string; subscriptionId: string };

export function DeleteSubscriptionButton({ projectId, subscriptionId }: Props) {
  const t = useTranslations("dashboard.deleteSubscription");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(t("confirm"))) return;
        startTransition(async () => {
          await deleteSubscription(projectId, subscriptionId);
        });
      }}
    >
      {pending ? t("removing") : t("remove")}
    </Button>
  );
}
