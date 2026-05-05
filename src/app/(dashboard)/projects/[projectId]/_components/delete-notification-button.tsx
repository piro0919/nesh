"use client";

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
  const [pending, startTransition] = useTransition();
  const label = status === "pending" ? "Cancel" : "Delete";
  const confirmMsg =
    status === "pending"
      ? "Cancel this scheduled notification?"
      : "Delete this notification from history?";

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
            toast.error(error instanceof Error ? error.message : "Failed");
          }
        });
      }}
    >
      {pending ? "..." : label}
    </Button>
  );
}
