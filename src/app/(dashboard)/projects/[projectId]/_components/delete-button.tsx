"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteProject } from "../../_actions";

type Props = { projectId: string; projectName: string };

export function DeleteProjectButton({ projectId, projectName }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
        startTransition(async () => {
          try {
            await deleteProject(projectId);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete");
          }
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
