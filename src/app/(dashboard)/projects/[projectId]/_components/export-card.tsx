import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { projectId: string };

export function ExportCard({ projectId }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">No lock-in: download your data as CSV at any time.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/projects/${projectId}/export/subscribers`} download>
              Subscribers CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/projects/${projectId}/export/notifications`} download>
              Notifications CSV
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
