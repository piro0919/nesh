"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteProject } from "../../_actions";

type Props = { projectId: string; projectName: string };

export function DeleteProjectButton({ projectId, projectName }: Props) {
  const t = useTranslations("dashboard.deleteProject");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(t("confirm", { name: projectName }))) return;
        startTransition(async () => {
          try {
            await deleteProject(projectId);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t("failed"));
          }
        });
      }}
    >
      {pending ? t("deleting") : t("delete")}
    </Button>
  );
}
