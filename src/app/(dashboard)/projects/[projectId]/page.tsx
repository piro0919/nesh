import { Bell, Send, Users, Webhook } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FREE_TIER, startOfCurrentMonthUtc } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ projectId: string }> };

export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!project) notFound();

  const monthStart = startOfCurrentMonthUtc().toISOString();

  const [{ count: subscriberCount }, { count: monthlySendCount }, { data: agg }, { data: recent }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("*", { head: true, count: "exact" })
        .eq("project_id", project.id),
      supabase
        .from("notifications")
        .select("*", { head: true, count: "exact" })
        .eq("project_id", project.id)
        .gte("created_at", monthStart),
      supabase.from("notifications").select("shown, clicked").eq("project_id", project.id),
      supabase
        .from("notifications")
        .select("id, title, created_at, shown, clicked")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const totals = (agg ?? []).reduce(
    (acc, n) => {
      acc.shown += n.shown ?? 0;
      acc.clicked += n.clicked ?? 0;
      return acc;
    },
    { shown: 0, clicked: 0 },
  );
  const ctr = totals.shown > 0 ? (totals.clicked / totals.shown) * 100 : 0;

  const subs = subscriberCount ?? 0;
  const sends = monthlySendCount ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-xs text-muted-foreground">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button asChild>
          <Link href={`/projects/${project.id}/notifications/new`}>
            <Send /> Send notification
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Subscribers"
          value={subs.toLocaleString()}
          sub={`/ ${FREE_TIER.SUBSCRIBERS_PER_PROJECT.toLocaleString()}`}
          href={`/projects/${project.id}/subscribers`}
          icon={<Users className="h-4 w-4" />}
        />
        <Stat
          label="Sends this month"
          value={sends.toLocaleString()}
          sub={`/ ${FREE_TIER.NOTIFICATIONS_PER_MONTH.toLocaleString()}`}
          href={`/projects/${project.id}/notifications`}
          icon={<Send className="h-4 w-4" />}
        />
        <Stat
          label="Total shown"
          value={totals.shown.toLocaleString()}
          href={`/projects/${project.id}/analytics`}
          icon={<Bell className="h-4 w-4" />}
        />
        <Stat
          label="Click-through rate"
          value={`${ctr.toFixed(1)}%`}
          sub={`${totals.clicked.toLocaleString()} clicks`}
          href={`/projects/${project.id}/analytics`}
          icon={<Webhook className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent notifications</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/projects/${project.id}/notifications`}>View all →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {(recent?.length ?? 0) === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No notifications sent yet.</p>
          ) : (
            <ul className="divide-y">
              {(recent ?? []).map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(n.shown ?? 0).toLocaleString()} shown · {(n.clicked ?? 0).toLocaleString()}{" "}
                    clicked
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  href,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition hover:border-foreground/20">
        <CardContent className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{label}</span>
            {icon}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold">{value}</span>
            {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
