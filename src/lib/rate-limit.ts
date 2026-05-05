import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
};

export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = params;
  const supabase = createAdminClient();

  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
  const resetAt = new Date(windowStart.getTime() + windowSeconds * 1000);

  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_key: key,
    p_window_start: windowStart.toISOString(),
  });
  if (error) {
    // Fail-open: don't block legitimate traffic on rate-limit infrastructure failures
    console.error("[rate-limit] error", error);
    return { ok: true, limit, remaining: limit, resetAt };
  }

  const count = typeof data === "number" ? data : 1;
  return {
    ok: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}
