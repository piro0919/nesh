"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CreateProjectState, createProject } from "../_actions";

export default function Page() {
  const t = useTranslations("dashboard.newProject");
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(
    createProject,
    undefined,
  );

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader title={t("title")} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" required maxLength={100} autoFocus />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
