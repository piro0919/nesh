"use client";

import { useTranslations } from "next-intl";

type Props = {
  title: string;
  body: string;
  icon: string;
  image: string;
  url: string;
};

export function NotificationPreview({ title, body, icon, image, url }: Props) {
  const t = useTranslations("dashboard.notificationPreview");
  const displayTitle = title.trim() || t("placeholderTitle");
  const displayBody = body.trim() || t("placeholderBody");
  let host = "your-site.example";
  try {
    if (url) host = new URL(url).host;
  } catch {
    // ignore — fall back to placeholder
  }

  return (
    <div className="sticky top-6 flex flex-col gap-3">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("livePreview")}
      </div>
      <div className="overflow-hidden rounded-lg border bg-[#1a1a1a] p-4 shadow-xl">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0a0a0a]">
            {icon ? (
              // biome-ignore lint/performance/noImgElement: dynamic external URL preview
              <img src={icon} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-white">N</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2 text-[10px] uppercase text-white/50">
              <span>Nesh</span>
              <span>·</span>
              <span>{host}</span>
              <span>·</span>
              <span>{t("now")}</span>
            </div>
            <div className="truncate text-sm font-semibold text-white">{displayTitle}</div>
            <p className="line-clamp-2 text-xs text-white/80">{displayBody}</p>
          </div>
        </div>
        {image ? (
          <div className="mt-3 overflow-hidden rounded">
            {/* biome-ignore lint/performance/noImgElement: dynamic external URL preview */}
            <img src={image} alt="" className="h-32 w-full object-cover" />
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
