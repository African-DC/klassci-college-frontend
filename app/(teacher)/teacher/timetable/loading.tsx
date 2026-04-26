import { Skeleton } from "@/components/ui/skeleton"

export default function TimetableLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-[500px] rounded-lg" />
    </div>
  )
}
