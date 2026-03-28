import { Skeleton } from "@/components/ui/skeleton"

export default function CouncilLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="rounded-lg border">
        {Array.from({ length: 10 }).map((_, i) => (
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
