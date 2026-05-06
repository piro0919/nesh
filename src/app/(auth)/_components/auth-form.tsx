"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState, signIn, signUp } from "../_actions";

type Props = { mode: "sign-in" | "sign-up" };

const COPY = {
  "sign-in": {
    title: "Welcome back",
    sub: "Sign in to your Nesh dashboard.",
    submit: "Sign in",
    submitting: "Signing in…",
    altPrompt: "No account?",
    altLabel: "Create one",
    altHref: "/sign-up",
  },
  "sign-up": {
    title: "Create your account",
    sub: "Start sending Web Push notifications in minutes.",
    submit: "Create account",
    submitting: "Creating account…",
    altPrompt: "Already have an account?",
    altLabel: "Sign in",
    altHref: "/sign-in",
  },
} as const;

/**
 * Supabase auth errors are sometimes terse ("Invalid login credentials").
 * Map known cases to friendlier text; let unknown ones fall through.
 */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match.";
  if (m.includes("user already registered"))
    return "That email is already registered. Try signing in.";
  if (m.includes("rate limit")) return "Too many attempts. Try again in a minute.";
  return message;
}

export function AuthForm({ mode }: Props) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const copy = COPY[mode];

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.sub}</p>
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {mode === "sign-up" ? (
            <span className="text-xs text-muted-foreground">8+ characters</span>
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
            className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? copy.submitting : copy.submit}
      </Button>

      {mode === "sign-up" ? (
        <p className="text-xs text-muted-foreground">
          By creating an account you agree the service is provided as-is during early access.
        </p>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {copy.altPrompt}{" "}
        <Link
          href={copy.altHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {copy.altLabel}
        </Link>
      </p>
    </form>
  );
}
