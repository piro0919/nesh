"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CreateProjectState, createProject } from "../_actions";

export default function Page() {
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(
    createProject,
    undefined,
  );

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">New project</h1>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={100} autoFocus />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
