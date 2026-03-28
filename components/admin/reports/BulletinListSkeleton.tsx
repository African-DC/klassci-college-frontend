import { Skeleton } from "@/components/ui/skeleton"

export function BulletinListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-0">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
