import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, created_at, subscriptions(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button asChild>
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">No projects yet. Create your first one.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((p) => {
            const count = (p.subscriptions as { count: number }[])[0]?.count ?? 0;
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="block">
                  <Card className="transition hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>{p.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created {new Date(p.created_at).toLocaleString()}</span>
                      <span>{count} subscribers</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
