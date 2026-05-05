"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "./copy-button";
import {
  deleteWebhook,
  rotateWebhookSecret,
  saveWebhook,
  testWebhook,
  type WebhookFormState,
} from "./webhook-actions";

type WebhookRow = {
  url: string;
  secret: string;
  enabled: boolean;
  last_delivery_at: string | null;
  last_delivery_status: number | null;
  last_delivery_error: string | null;
};

type Props = {
  projectId: string;
  webhook: WebhookRow | null;
};

export function WebhookCard({ projectId, webhook }: Props) {
  const saveAction = saveWebhook.bind(null, projectId);
  const [saveState, saveFormAction, savePending] = useActionState<WebhookFormState, FormData>(
    saveAction,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Receive a signed <code>POST</code> after each successful send. The body is JSON; verify
          with the <code>X-Nesh-Signature</code> header (
          <code>sha256=&lt;hex hmac of body&gt;</code>
          ).
        </p>

        <form action={saveFormAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <Input
              id="webhook-url"
              name="url"
              type="url"
              defaultValue={webhook?.url ?? ""}
              placeholder="https://example.com/webhook"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={webhook?.enabled ?? true}
              className="h-4 w-4"
            />
            Enabled
          </label>
          {saveState && "error" in saveState ? (
            <p className="text-sm text-destructive">{saveState.error}</p>
          ) : null}
          {saveState && "ok" in saveState ? (
            <p className="text-sm text-green-600">{saveState.ok}</p>
          ) : null}
          <div>
            <Button type="submit" disabled={savePending}>
              {savePending ? "Saving…" : webhook ? "Save changes" : "Create webhook"}
            </Button>
          </div>
        </form>

        {webhook ? (
          <>
            <SecretRow projectId={projectId} secret={webhook.secret} />
            <DeliveryStatus webhook={webhook} />
            <ActionsRow projectId={projectId} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SecretRow({ projectId, secret }: { projectId: string; secret: string }) {
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="grid gap-2 rounded border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Signing secret</span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShow((v) => !v)}>
            {show ? "Hide" : "Show"}
          </Button>
          <CopyButton value={secret} label="Secret" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (
                !confirm("Rotate the signing secret? Existing receivers will break until updated.")
              ) {
                return;
              }
              startTransition(async () => {
                await rotateWebhookSecret(projectId);
              });
            }}
          >
            {pending ? "Rotating…" : "Rotate"}
          </Button>
        </div>
      </div>
      <code className="break-all text-xs">{show ? secret : "•".repeat(secret.length)}</code>
    </div>
  );
}

function DeliveryStatus({ webhook }: { webhook: WebhookRow }) {
  if (!webhook.last_delivery_at) {
    return <p className="text-xs text-muted-foreground">No deliveries yet.</p>;
  }
  const ok =
    webhook.last_delivery_status &&
    webhook.last_delivery_status >= 200 &&
    webhook.last_delivery_status < 300;
  return (
    <p className="text-xs text-muted-foreground">
      Last delivery {new Date(webhook.last_delivery_at).toLocaleString()} —{" "}
      <span className={ok ? "text-green-600" : "text-destructive"}>
        {webhook.last_delivery_status ?? "network error"}
      </span>
      {webhook.last_delivery_error ? ` (${webhook.last_delivery_error})` : ""}
    </p>
  );
}

function ActionsRow({ projectId }: { projectId: string }) {
  const [testPending, startTest] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [testMessage, setTestMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={testPending}
        onClick={() => {
          setTestMessage(null);
          startTest(async () => {
            const res = await testWebhook(projectId);
            if (res && "ok" in res) setTestMessage(res.ok);
          });
        }}
      >
        {testPending ? "Sending…" : "Send test"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={deletePending}
        onClick={() => {
          if (!confirm("Delete this webhook?")) return;
          startDelete(async () => {
            await deleteWebhook(projectId);
          });
        }}
      >
        {deletePending ? "Deleting…" : "Delete webhook"}
      </Button>
      {testMessage ? <span className="text-xs text-green-600">{testMessage}</span> : null}
    </div>
  );
}
