"use client";

import { use, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CreateNotificationState, createNotification } from "../_actions";

type Props = { params: Promise<{ projectId: string }> };

export default function Page({ params }: Props) {
  const { projectId } = use(params);
  const [mode, setMode] = useState<"immediate" | "scheduled">("immediate");

  const action = createNotification.bind(null, projectId);
  const [state, formAction, pending] = useActionState<CreateNotificationState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">New notification</h1>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={200} autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          required
          maxLength={1000}
          rows={4}
          className="rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="url">URL (optional)</Label>
        <Input id="url" name="url" type="url" placeholder="https://example.com" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Send</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            value="immediate"
            checked={mode === "immediate"}
            onChange={() => setMode("immediate")}
          />
          Immediately
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            value="scheduled"
            checked={mode === "scheduled"}
            onChange={() => setMode("scheduled")}
          />
          At a specific time
        </label>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="target_user_ids">Target user IDs (optional)</Label>
        <textarea
          id="target_user_ids"
          name="target_user_ids"
          rows={3}
          placeholder="Leave empty to broadcast. Otherwise comma- or newline-separated."
          className="rounded border px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Matches subscriptions whose <code>userId</code> (set via the SDK) is in this list. Empty =
          send to all.
        </p>
      </div>

      {mode === "scheduled" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="scheduled_at">Scheduled at (local time)</Label>
          <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
        </div>
      ) : null}

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : mode === "immediate" ? "Send now" : "Schedule"}
      </Button>
    </form>
  );
}
