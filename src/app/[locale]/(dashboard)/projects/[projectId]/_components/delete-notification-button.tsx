"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteNotification } from "../notifications/_actions";

type Props = {
  projectId: string;
  notificationId: string;
  status: "pending" | "sent";
};

export function DeleteNotificationButton({ projectId, notificationId, status }: Props) {
  const t = useTranslations("dashboard.deleteNotification");
  const [pending, startTransition] = useTransition();
  const label = status === "pending" ? t("cancel") : t("delete");
  const confirmMsg = status === "pending" ? t("confirmCancel") : t("confirmDelete");

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmMsg)) return;
        startTransition(async () => {
          try {
            await deleteNotification(projectId, notificationId);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t("failed"));
          }
        });
      }}
    >
      {pending ? "..." : label}
    </Button>
  );
}
