import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Skeleton className="h-9 max-w-md flex-1" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <Skeleton className="h-8 w-16" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
