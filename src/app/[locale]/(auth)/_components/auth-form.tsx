"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { type AuthState, signIn, signUp } from "../_actions";

type Props = { mode: "sign-in" | "sign-up" };

function useFriendlyError() {
  const t = useTranslations("auth.errors");
  return (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("invalid login")) return t("invalidCredentials");
    if (m.includes("user already registered")) return t("alreadyRegistered");
    if (m.includes("rate limit")) return t("rateLimit");
    return message;
  };
}

export function AuthForm({ mode }: Props) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const tCommon = useTranslations("auth.common");
  const t = useTranslations(mode === "sign-in" ? "auth.signIn" : "auth.signUp");
  const altHref = mode === "sign-in" ? "/sign-up" : "/sign-in";
  const friendlyError = useFriendlyError();

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{friendlyError(state.error)}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{tCommon("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder={tCommon("emailPlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{tCommon("password")}</Label>
          {mode === "sign-up" ? (
            <span className="text-xs text-muted-foreground">{tCommon("passwordHint")}</span>
          ) : null}
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={mode === "sign-up" ? 8 : 6}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="-translate-y-1/2 absolute top-1/2 right-1 flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? tCommon("hidePassword") : tCommon("showPassword")}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? t("submitting") : t("submit")}
      </Button>

      {mode === "sign-up" ? (
        <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {t("altPrompt")}{" "}
        <Link
          href={altHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("altLabel")}
        </Link>
      </p>
    </form>
  );
}
