"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type HeroNotification = {
  title: string;
  body: string;
};

type Visible = HeroNotification & { key: number };

const CYCLE_MS = 3200;

export function HeroNotifications({ samples }: { samples: HeroNotification[] }) {
  // SSR / initial render: show the first 3 samples statically (visible to crawlers).
  const [visible, setVisible] = useState<Visible[]>(() =>
    samples.slice(0, 3).map((s, i) => ({ ...s, key: -1 - i })),
  );
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);

    let cursor = 3;
    let keySeq = 1;
    const id = window.setInterval(() => {
      const next = samples[cursor % samples.length];
      cursor++;
      setVisible((prev) => [{ ...next, key: keySeq++ }, ...prev].slice(0, 3));
    }, CYCLE_MS);

    return () => window.clearInterval(id);
  }, [samples]);

  return (
    <div className="-space-y-2 absolute top-12 right-4 flex w-[78%] flex-col items-end sm:right-6 sm:w-[64%]">
      {visible.map((n, i) => (
        <NotifCard
          key={n.key}
          title={n.title}
          body={n.body}
          tone={i === 0 ? "primary" : "muted"}
          offset={i as 0 | 1 | 2}
          animate={animate}
        />
      ))}
    </div>
  );
}

function NotifCard({
  title,
  body,
  tone,
  offset,
  animate,
}: {
  title: string;
  body: string;
  tone: "primary" | "muted";
  offset: 0 | 1 | 2;
  animate: boolean;
}) {
  const stack = [
    "translate-y-0 scale-100 opacity-100 z-30",
    "translate-y-3 scale-[0.95] opacity-80 z-20",
    "translate-y-6 scale-[0.9] opacity-60 z-10",
  ];
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 shadow-2xl backdrop-blur-md",
        animate && "duration-500 ease-out animate-in slide-in-from-top-4 fade-in",
        animate && "transition-[transform,opacity]",
        tone === "primary"
          ? "border-primary/30 bg-zinc-900/95 shadow-primary/30"
          : "border-zinc-800/80 bg-zinc-900/80 shadow-black/40",
        stack[offset],
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-semibold text-sm",
          tone === "primary"
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/40"
            : "bg-zinc-800 text-zinc-300",
        )}
      >
        N
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium text-xs text-zinc-100">{title}</span>
          <span className="shrink-0 text-[10px] text-zinc-300">now</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-200">{body}</p>
      </div>
    </div>
  );
}
