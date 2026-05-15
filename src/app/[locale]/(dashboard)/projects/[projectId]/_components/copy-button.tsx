"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = { value: string; label: string };

export function CopyButton({ value, label }: Props) {
  const t = useTranslations("dashboard.copy");
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(t("copiedLabel", { label }));
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error(t("failed"));
        }
      }}
    >
      {copied ? t("copied") : t("copy")}
    </Button>
  );
}
