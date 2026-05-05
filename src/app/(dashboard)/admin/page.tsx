import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/is-admin";
import { startOfCurrentMonthUtc } from "@/lib/limits";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  subscribers: number;
  sends_this_month: number;
  shown_total: number;
  clicked_total: number;
};

export default async function Page() {
  await requireAdmin();
  const supabase = createAdminClient();
  const monthStart = startOfCurrentMonthUtc().toISOString();

  const [{ count: totalProjects }, { count: totalSubs }, { count: totalNotifications }] =
    await Promise.all([
      supabase.from("projects").select("*", { head: true, count: "exact" }),
      supabase.from("subscriptions").select("*", { head: true, count: "exact" }),
      supabase.from("notifications").select("*", { head: true, count: "exact" }),
    ]);

  const { count: monthlyNotifications } = await supabase
    .from("notifications")
    .select("*", { head: true, count: "exact" })
    .gte("created_at", monthStart);

  // Per-project rollup. We do the aggregations client-side over a compact
  // result set; for the free-tier MVP this is well within budget.
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, user_id, created_at")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map((p) => p.id);
  const [subsByProject, sendsThisMonth, allNotifications] = await Promise.all([
    supabase.from("subscriptions").select("project_id").in("project_id", projectIds),
    supabase
      .from("notifications")
      .select("project_id")
      .in("project_id", projectIds)
      .gte("created_at", monthStart),
    supabase
      .from("notifications")
      .select("project_id, shown, clicked")
      .in("project_id", projectIds),
  ]);

  const subCount = countBy(subsByProject.data ?? [], "project_id");
  const sendCount = countBy(sendsThisMonth.data ?? [], "project_id");
  const sumByProject = (allNotifications.data ?? []).reduce<
    Record<string, { shown: number; clicked: number }>
  >((acc, n) => {
    if (!n.project_id) return acc;
    const cur = acc[n.project_id] ?? { shown: 0, clicked: 0 };
    cur.shown += n.shown ?? 0;
    cur.clicked += n.clicked ?? 0;
    acc[n.project_id] = cur;
    return acc;
  }, {});

  const rows: ProjectRow[] = (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    user_id: p.user_id,
    created_at: p.created_at,
    subscribers: subCount[p.id] ?? 0,
    sends_this_month: sendCount[p.id] ?? 0,
    shown_total: sumByProject[p.id]?.shown ?? 0,
    clicked_total: sumByProject[p.id]?.clicked ?? 0,
  }));

  // Distinct user count from project rows; small data set so trivially fine.
  const uniqueUsers = new Set(rows.map((r) => r.user_id)).size;

  const { data: errors } = await supabase
    .from("error_logs")
    .select("id, project_id, context, message, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin · usage</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users (with projects)" value={uniqueUsers} />
        <Stat label="Projects" value={totalProjects ?? 0} />
        <Stat label="Subscribers" value={totalSubs ?? 0} />
        <Stat label="Notifications (all-time)" value={totalNotifications ?? 0} />
        <Stat label="Notifications (this month UTC)" value={monthlyNotifications ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Per-project breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-right">Subs</th>
                <th className="px-4 py-2 text-right">Sends (mo.)</th>
                <th className="px-4 py-2 text-right">Shown</th>
                <th className="px-4 py-2 text-right">Clicked</th>
                <th className="px-4 py-2 text-right">CTR</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => {
                const ctr = r.shown_total > 0 ? (r.clicked_total / r.shown_total) * 100 : 0;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/projects/${r.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {r.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{r.user_id}</div>
                    </td>
                    <td className="px-4 py-2 text-right">{r.subscribers.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{r.sends_this_month.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{r.shown_total.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{r.clicked_total.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{ctr.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No projects.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent errors (cross-project)</CardTitle>
        </CardHeader>
        <CardContent>
          {(errors?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No errors logged.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-xs">
              {(errors ?? []).map((e) => (
                <li key={e.id} className="flex items-baseline gap-3 border-b py-1 last:border-b-0">
                  <span className="text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                  <code className="text-xs">{e.context}</code>
                  <span className="text-muted-foreground">
                    {e.project_id ? e.project_id.slice(0, 8) : "—"}
                  </span>
                  <span className="truncate text-destructive" title={e.message}>
                    {e.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold">{value.toLocaleString()}</span>
      </CardContent>
    </Card>
  );
}

function countBy<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = r[key];
    if (typeof k !== "string") continue;
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}
