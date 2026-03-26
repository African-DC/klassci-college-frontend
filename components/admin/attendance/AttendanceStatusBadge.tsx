"use client"

import { Badge } from "@/components/ui/badge"
import type { AttendanceStatus } from "@/lib/contracts/attendance"

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; variant: "default" | "secondary" | "destructive"; className?: string }> = {
  present: { label: "Présent", variant: "default", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  absent: { label: "Absent", variant: "destructive" },
  retard: { label: "Retard", variant: "secondary", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  excuse: { label: "Excusé", variant: "secondary", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus | null }) {
  if (!status) return <span className="text-sm text-muted-foreground">—</span>
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
