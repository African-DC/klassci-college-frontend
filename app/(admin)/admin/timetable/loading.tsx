import { Skeleton } from "@/components/ui/skeleton"

export default function TimetableLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-52" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="rounded-lg border">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 border-b last:border-0 p-2">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-14 mx-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
