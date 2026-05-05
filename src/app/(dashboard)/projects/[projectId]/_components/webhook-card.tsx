"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "./copy-button";
import {
  createWebhook,
  deleteWebhook,
  rotateWebhookSecret,
  testWebhook,
  updateWebhook,
  type WebhookFormState,
} from "./webhook-actions";

export type WebhookRow = {
  id: string;
  name: string | null;
  url: string;
  secret: string;
  enabled: boolean;
  events: string[] | null;
  last_delivery_at: string | null;
  last_delivery_status: number | null;
  last_delivery_error: string | null;
};

const EVENT_TYPES = [
  { value: "notification.sent", label: "notification.sent" },
  { value: "subscription.created", label: "subscription.created" },
  { value: "subscription.removed", label: "subscription.removed" },
] as const;

function EventFilterCheckboxes({ selected }: { selected: string[] | null }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-xs font-medium">Events</legend>
      <p className="text-xs text-muted-foreground">
        Leave all checked to receive every event type.
      </p>
      <div className="flex flex-wrap gap-3">
        {EVENT_TYPES.map((e) => {
          const checked = selected === null || selected.includes(e.value);
          return (
            <label key={e.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="events"
                value={e.value}
                defaultChecked={checked}
                className="h-4 w-4"
              />
              <code className="text-xs">{e.label}</code>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export type DeliveryRow = {
  id: string;
  webhook_id: string;
  event_type: string;
  status_code: number | null;
  error: string | null;
  created_at: string;
  attempts: number;
  next_attempt_at: string | null;
};

type Props = {
  projectId: string;
  webhooks: WebhookRow[];
  deliveriesByWebhook: Record<string, DeliveryRow[]>;
};

export function WebhooksCard({ projectId, webhooks, deliveriesByWebhook }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhooks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Each enabled webhook receives a signed <code>POST</code> after every successful send.
          Verify with <code>X-Nesh-Signature</code> (<code>sha256=&lt;hex hmac of body&gt;</code>).
          See{" "}
          <a href="/docs#webhooks" className="underline-offset-2 hover:underline">
            /docs
          </a>
          .
        </p>

        {webhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No webhooks yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {webhooks.map((w) => (
              <WebhookItem
                key={w.id}
                projectId={projectId}
                webhook={w}
                deliveries={deliveriesByWebhook[w.id] ?? []}
              />
            ))}
          </div>
        )}

        <CreateWebhookForm projectId={projectId} />
      </CardContent>
    </Card>
  );
}

function CreateWebhookForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const action = createWebhook.bind(null, projectId);
  const [state, formAction, pending] = useActionState<WebhookFormState, FormData>(
    action,
    undefined,
  );

  if (state && "ok" in state && open) {
    setOpen(false);
  }

  if (!open) {
    return (
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Add webhook
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <div className="text-sm font-medium">New webhook</div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-url">Endpoint URL</Label>
        <Input
          id="new-url"
          name="url"
          type="url"
          required
          placeholder="https://example.com/webhook"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-name">Name (optional)</Label>
        <Input id="new-name" name="name" placeholder="e.g. slack-alerts" />
      </div>
      <EventFilterCheckboxes selected={null} />
      {state && "error" in state ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function WebhookItem({
  projectId,
  webhook,
  deliveries,
}: {
  projectId: string;
  webhook: WebhookRow;
  deliveries: DeliveryRow[];
}) {
  const update = updateWebhook.bind(null, projectId, webhook.id);
  const [updateState, updateAction, updatePending] = useActionState<WebhookFormState, FormData>(
    update,
    undefined,
  );
  const [showSecret, setShowSecret] = useState(false);
  const [secretPending, startSecret] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [testPending, startTest] = useTransition();
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [showDeliveries, setShowDeliveries] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded border p-4">
      <form action={updateAction} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`url-${webhook.id}`} className="text-xs">
              URL
            </Label>
            <Input id={`url-${webhook.id}`} name="url" type="url" defaultValue={webhook.url} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`name-${webhook.id}`} className="text-xs">
              Name
            </Label>
            <Input id={`name-${webhook.id}`} name="name" defaultValue={webhook.name ?? ""} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={webhook.enabled}
            className="h-4 w-4"
          />
          Enabled
        </label>
        <EventFilterCheckboxes selected={webhook.events} />
        {updateState && "error" in updateState ? (
          <p className="text-xs text-destructive">{updateState.error}</p>
        ) : null}
        {updateState && "ok" in updateState ? (
          <p className="text-xs text-green-600">{updateState.ok}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={updatePending}>
            {updatePending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={testPending}
            onClick={() => {
              setTestMessage(null);
              startTest(async () => {
                const res = await testWebhook(projectId, webhook.id);
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
                await deleteWebhook(projectId, webhook.id);
              });
            }}
          >
            {deletePending ? "Deleting…" : "Delete"}
          </Button>
          {testMessage ? <span className="text-xs text-green-600">{testMessage}</span> : null}
        </div>
      </form>

      <div className="grid gap-2 rounded bg-muted/30 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium">Signing secret</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSecret((v) => !v)}
            >
              {showSecret ? "Hide" : "Show"}
            </Button>
            <CopyButton value={webhook.secret} label="Secret" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={secretPending}
              onClick={() => {
                if (
                  !confirm(
                    "Rotate the signing secret? Existing receivers will break until updated.",
                  )
                ) {
                  return;
                }
                startSecret(async () => {
                  await rotateWebhookSecret(projectId, webhook.id);
                });
              }}
            >
              {secretPending ? "Rotating…" : "Rotate"}
            </Button>
          </div>
        </div>
        <code className="break-all">
          {showSecret ? webhook.secret : "•".repeat(webhook.secret.length)}
        </code>
      </div>

      <DeliveryStatusLine webhook={webhook} />

      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDeliveries((v) => !v)}
        >
          {showDeliveries ? "Hide deliveries" : `Recent deliveries (${deliveries.length})`}
        </Button>
        {showDeliveries ? <DeliveriesList deliveries={deliveries} /> : null}
      </div>
    </div>
  );
}

function DeliveryStatusLine({ webhook }: { webhook: WebhookRow }) {
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

function DeliveriesList({ deliveries }: { deliveries: DeliveryRow[] }) {
  if (deliveries.length === 0) {
    return <p className="mt-2 text-xs text-muted-foreground">No deliveries logged yet.</p>;
  }
  return (
    <ul className="mt-2 flex flex-col gap-1 text-xs">
      {deliveries.map((d) => {
        const ok = d.status_code && d.status_code >= 200 && d.status_code < 300;
        const retrying = d.next_attempt_at !== null;
        const tone = ok ? "text-green-600" : retrying ? "text-amber-600" : "text-destructive";
        return (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3 border-b py-1 last:border-b-0"
          >
            <span className="text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
            <span className="text-muted-foreground">
              {d.event_type}
              {d.attempts > 1 ? ` · attempt ${d.attempts}` : ""}
            </span>
            <span className={tone}>
              {d.status_code ?? "net err"}
              {retrying && d.next_attempt_at
                ? ` · retry at ${new Date(d.next_attempt_at).toLocaleTimeString()}`
                : d.error
                  ? ` · ${d.error}`
                  : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
