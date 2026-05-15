import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-4">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex flex-col gap-2 border-b pb-3 last:border-b-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
