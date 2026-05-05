import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type Props = { projectId: string };

const DAYS = 30;

type DayBucket = {
  date: string;
  sent: number;
  delivered: number;
  shown: number;
  clicked: number;
};

export async function AnalyticsChart({ projectId }: Props) {
  const supabase = await createClient();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (DAYS - 1));

  const { data, error } = await supabase
    .from("notifications")
    .select("created_at, status, delivered, shown, clicked")
    .eq("project_id", projectId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  const buckets = new Map<string, DayBucket>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, sent: 0, delivered: 0, shown: 0, clicked: 0 });
  }
  for (const n of data ?? []) {
    if (n.status !== "sent") continue;
    const key = new Date(n.created_at).toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.sent += 1;
    b.delivered += n.delivered ?? 0;
    b.shown += n.shown ?? 0;
    b.clicked += n.clicked ?? 0;
  }

  const series = [...buckets.values()];
  const totals = series.reduce(
    (acc, b) => ({
      sent: acc.sent + b.sent,
      delivered: acc.delivered + b.delivered,
      shown: acc.shown + b.shown,
      clicked: acc.clicked + b.clicked,
    }),
    { sent: 0, delivered: 0, shown: 0, clicked: 0 },
  );

  const max = Math.max(1, ...series.map((b) => b.delivered));
  const showRate = totals.delivered === 0 ? 0 : Math.round((totals.shown / totals.delivered) * 100);
  const clickRate = totals.shown === 0 ? 0 : Math.round((totals.clicked / totals.shown) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last {DAYS} days</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Notifications" value={totals.sent.toLocaleString()} />
          <Stat label="Delivered" value={totals.delivered.toLocaleString()} />
          <Stat
            label="Shown"
            value={totals.shown.toLocaleString()}
            sub={totals.delivered > 0 ? `${showRate}% of delivered` : undefined}
          />
          <Stat
            label="Clicked"
            value={totals.clicked.toLocaleString()}
            sub={totals.shown > 0 ? `${clickRate}% of shown` : undefined}
          />
        </div>
        <div
          className="grid items-end gap-px"
          style={{ gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))`, height: 96 }}
        >
          {series.map((b) => {
            const h = Math.round((b.delivered / max) * 100);
            return (
              <div
                key={b.date}
                className="rounded-sm bg-foreground/80"
                style={{
                  height: `${Math.max(h, b.delivered > 0 ? 4 : 1)}%`,
                  opacity: h > 0 ? 1 : 0.15,
                }}
                title={`${b.date} — ${b.sent} sent · ${b.delivered} delivered · ${b.shown} shown · ${b.clicked} clicked`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{series[0].date}</span>
          <span>Daily delivered (hover for detail)</span>
          <span>{series[series.length - 1].date}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}
