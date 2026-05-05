"use client";

import { useActionState, useState } from "react";
import { type RenameProjectState, renameProject } from "@/app/(dashboard)/projects/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { projectId: string; name: string };

export function ProjectName({ projectId, name }: Props) {
  const [editing, setEditing] = useState(false);
  const action = renameProject.bind(null, projectId);
  const [state, formAction, pending] = useActionState<RenameProjectState, FormData>(
    action,
    undefined,
  );

  // Close the editor as soon as the rename succeeds.
  if (editing && state && "ok" in state) {
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{name}</h1>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Rename
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-md items-center gap-2">
      <Input
        name="name"
        defaultValue={name}
        required
        maxLength={100}
        autoFocus
        className="text-lg"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setEditing(false)}
      >
        Cancel
      </Button>
      {state && "error" in state ? (
        <span className="text-sm text-destructive">{state.error}</span>
      ) : null}
    </form>
  );
}
