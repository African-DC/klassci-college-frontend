import { Skeleton } from "@/components/ui/skeleton"

export default function RetakesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-11 w-28 rounded-full" />
        <Skeleton className="h-11 w-20 rounded-full" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
