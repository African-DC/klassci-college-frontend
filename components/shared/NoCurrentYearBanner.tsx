"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { Route } from "next"
import { useAcademicYearStore } from "@/lib/stores/useAcademicYearStore"
import { Button } from "@/components/ui/button"

export function NoCurrentYearBanner() {
  const { currentYear, isLoading } = useAcademicYearStore()

  if (isLoading || currentYear) return null

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="text-sm font-medium text-destructive">Aucune annee academique courante</p>
        <p className="text-sm text-muted-foreground">
          Veuillez definir l&apos;annee academique courante pour utiliser l&apos;application.
        </p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link href={"/admin/academic-years" as Route}>Configurer</Link>
      </Button>
    </div>
  )
}
