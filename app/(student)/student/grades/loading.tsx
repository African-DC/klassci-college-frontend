import { Skeleton } from "@/components/ui/skeleton"

export default function GradesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-10 w-44" />
      <Skeleton className="h-20 rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  )
}
