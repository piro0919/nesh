"use client";

import { useTranslations } from "next-intl";
import { use, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CreateNotificationState, createNotification } from "../_actions";
import { NotificationPreview } from "./_components/notification-preview";

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
    image?: string;
    badge?: string;
    target_user_ids?: string;
  }>;
};

export default function Page({ params, searchParams }: Props) {
  const t = useTranslations("dashboard.newNotification");
  const { projectId } = use(params);
  const initial = use(searchParams);
  const [mode, setMode] = useState<"immediate" | "scheduled">("immediate");
  const [title, setTitle] = useState(initial.title ?? "");
  const [body, setBody] = useState(initial.body ?? "");
  const [url, setUrl] = useState(initial.url ?? "");
  const [icon, setIcon] = useState(initial.icon ?? "");
  const [image, setImage] = useState(initial.image ?? "");
  const [badge, setBadge] = useState(initial.badge ?? "");
  const hasVisuals = Boolean(icon || image || badge);

  const action = createNotification.bind(null, projectId);
  const [state, formAction, pending] = useActionState<CreateNotificationState, FormData>(
    action,
    undefined,
  );

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <form action={formAction} className="flex w-full flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">{t("titleField")}</Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={200}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="body">{t("body")}</Label>
          <textarea
            id="body"
            name="body"
            required
            maxLength={1000}
            rows={4}
            className="rounded border px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="url">{t("url")}</Label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <details className="rounded border px-3 py-2 text-sm" open={hasVisuals}>
          <summary className="cursor-pointer select-none font-medium">{t("visuals")}</summary>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="icon">{t("iconUrl")}</Label>
              <Input
                id="icon"
                name="icon"
                type="url"
                placeholder="https://example.com/icon-192.png"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("iconHint")}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="image">{t("imageUrl")}</Label>
              <Input
                id="image"
                name="image"
                type="url"
                placeholder="https://example.com/hero.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="badge">{t("badgeUrl")}</Label>
              <Input
                id="badge"
                name="badge"
                type="url"
                placeholder="https://example.com/badge-72.png"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("badgeHint")}</p>
            </div>
          </div>
        </details>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("send")}</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mode"
              value="immediate"
              checked={mode === "immediate"}
              onChange={() => setMode("immediate")}
            />
            {t("immediately")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mode"
              value="scheduled"
              checked={mode === "scheduled"}
              onChange={() => setMode("scheduled")}
            />
            {t("atSpecificTime")}
          </label>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="target_user_ids">{t("targetUserIds")}</Label>
          <textarea
            id="target_user_ids"
            name="target_user_ids"
            rows={3}
            placeholder={t("targetPlaceholder")}
            className="rounded border px-3 py-2 text-sm"
            defaultValue={initial.target_user_ids ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            {t.rich("targetHint", { code: () => <code>userId</code> })}
          </p>
        </div>

        {mode === "scheduled" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="scheduled_at">{t("scheduledAt")}</Label>
            <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
          </div>
        ) : null}

        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

        <Button type="submit" disabled={pending}>
          {pending ? t("sending") : mode === "immediate" ? t("sendNow") : t("schedule")}
        </Button>
      </form>

      <div className="hidden lg:block">
        <NotificationPreview title={title} body={body} icon={icon} image={image} url={url} />
      </div>
    </div>
  );
}
