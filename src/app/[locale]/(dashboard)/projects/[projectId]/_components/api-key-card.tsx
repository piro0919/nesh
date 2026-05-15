"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { regenerateApiKey } from "@/app/[locale]/(dashboard)/projects/_actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "./copy-button";

type Props = {
  projectId: string;
  apiKey: string;
  apiBase: string;
};

export function ApiKeyCard({ projectId, apiKey, apiBase }: Props) {
  const t = useTranslations("dashboard.apiKey");
  const [revealed, setRevealed] = useState(false);
  const [pending, startTransition] = useTransition();

  const masked = `${apiKey.slice(0, 12)}${"•".repeat(20)}`;
  const curl = `curl -X POST ${apiBase}/notifications \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Hello","body":"From the REST API","url":"https://example.com"}'`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("apiKey")}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevealed((v) => !v)}
              >
                {revealed ? t("hide") : t("show")}
              </Button>
              <CopyButton value={apiKey} label={t("apiKey")} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (!confirm(t("regenerateConfirm"))) return;
                  startTransition(async () => {
                    try {
                      await regenerateApiKey(projectId);
                      toast.success(t("regenerated"));
                      setRevealed(false);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : t("regenerateFailed"));
                    }
                  });
                }}
              >
                {pending ? "..." : t("regenerate")}
              </Button>
            </div>
          </div>
          <code className="break-all text-xs">{revealed ? apiKey : masked}</code>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("sendViaCurl")}</span>
            <CopyButton value={curl} label={t("snippet")} />
          </div>
          <pre className="overflow-x-auto rounded border bg-muted p-3 text-xs">
            <code>{curl}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
