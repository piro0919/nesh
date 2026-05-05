import { createAdminClient } from "@/lib/supabase/admin";

type LogOptions = {
  projectId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Best-effort server-side error capture. Logs to console (so it shows up in
 * Vercel runtime logs) AND inserts into public.error_logs for the dashboard.
 * Never throws — a failure here must not mask the original error.
 */
export async function logError(
  context: string,
  err: unknown,
  options: LogOptions = {},
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? (err.stack ?? null) : null;

  console.error(`[${context}]`, err, options.metadata ?? "");

  try {
    const supabase = createAdminClient();
    await supabase.from("error_logs").insert({
      project_id: options.projectId ?? null,
      context,
      message: message.slice(0, 4_000),
      stack: stack ? stack.slice(0, 8_000) : null,
      metadata: options.metadata ? (options.metadata as never) : null,
    });
  } catch (insertErr) {
    console.error("[error-log] insert failed", insertErr);
  }
}
