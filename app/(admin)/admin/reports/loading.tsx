import { BulletinListSkeleton } from "@/components/admin/reports/BulletinListSkeleton"

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <BulletinListSkeleton />
    </div>
  )
}
