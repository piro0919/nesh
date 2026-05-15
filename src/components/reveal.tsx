"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

type State = "visible" | "hidden" | "revealed";

/**
 * Fade-in + slight upward translate when the element enters the viewport.
 *
 * SSR renders content visible so crawlers and JS-disabled users always see it.
 * After hydration, elements that are below the fold get hidden and re-revealed
 * via IntersectionObserver. Elements already in view skip the animation.
 */
export function Reveal({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("visible");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = node.getBoundingClientRect();
    // Already on screen at hydration → leave visible, no animation.
    if (rect.top < window.innerHeight) return;

    setState("hidden");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setState("revealed");
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        state !== "visible" && "transition-all duration-700 ease-out will-change-transform",
        state === "hidden" && "translate-y-4 opacity-0",
        state === "revealed" && "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
