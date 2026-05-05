// Free-tier hard caps. These prevent runaway abuse and cost while we operate
// without a paid plan. Once paid plans exist, branch on user/project plan.
export const FREE_TIER = {
  PROJECTS_PER_USER: 1,
  SUBSCRIBERS_PER_PROJECT: 5_000,
  NOTIFICATIONS_PER_MONTH: 10_000,
} as const;

export function startOfCurrentMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
