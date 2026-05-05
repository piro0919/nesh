"use client";

import { useActionState } from "react";
import {
  type UpdateDefaultsState,
  updateProjectDefaults,
} from "@/app/(dashboard)/projects/_actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  projectId: string;
  defaultIcon: string | null;
  defaultBadge: string | null;
};

export function DefaultsCard({ projectId, defaultIcon, defaultBadge }: Props) {
  const action = updateProjectDefaults.bind(null, projectId);
  const [state, formAction, pending] = useActionState<UpdateDefaultsState, FormData>(
    action,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification defaults</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Used when a notification is sent without specifying its own icon / badge. Leave blank to
            use the OS default.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="default_icon">Default icon URL</Label>
            <Input
              id="default_icon"
              name="default_icon"
              type="url"
              defaultValue={defaultIcon ?? ""}
              placeholder="https://example.com/icon-192.png"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="default_badge">Default badge URL</Label>
            <Input
              id="default_badge"
              name="default_badge"
              type="url"
              defaultValue={defaultBadge ?? ""}
              placeholder="https://example.com/badge-72.png"
            />
          </div>
          {state && "error" in state ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state && "ok" in state ? <p className="text-sm text-green-600">Saved.</p> : null}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save defaults"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
