"use client"

import { GraduationCap, AlertTriangle } from "lucide-react"
import { useAcademicYearStore } from "@/lib/stores/useAcademicYearStore"
import { Skeleton } from "@/components/ui/skeleton"

export function AcademicYearBadge() {
  const { currentYear, isLoading } = useAcademicYearStore()

  if (isLoading) return <Skeleton className="h-7 w-32" />

  if (!currentYear) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" />
        Aucune annee definie
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      <GraduationCap className="h-3.5 w-3.5" />
      {currentYear.name}
    </div>
  )
}
