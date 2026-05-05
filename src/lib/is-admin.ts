import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Admins are configured via the ADMIN_USER_IDS env var (comma-separated
 * Supabase auth user UUIDs). When unset, no one is an admin.
 */
function adminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!adminUserIds().has(user.id)) {
    // Don't reveal that an admin route exists.
    notFound();
  }
  return user;
}
