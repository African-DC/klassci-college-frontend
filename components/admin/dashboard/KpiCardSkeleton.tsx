import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function KpiCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-11 w-11 rounded-lg" />
      </CardContent>
    </Card>
  )
}
