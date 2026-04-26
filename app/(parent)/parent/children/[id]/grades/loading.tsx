import { Skeleton } from "@/components/ui/skeleton"

export default function ParentChildGradesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-44" />
      <Skeleton className="h-20 rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  )
}
