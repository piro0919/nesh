import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <ul className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
