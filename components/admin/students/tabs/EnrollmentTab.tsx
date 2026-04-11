"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataError } from "@/components/shared/DataError"
import { useEnrollments } from "@/lib/hooks/useEnrollments"

interface EnrollmentTabProps {
  studentId: number
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  prospect: { label: "Prospect", variant: "outline" },
  en_validation: { label: "En validation", variant: "secondary", className: "bg-amber-500 text-white hover:bg-amber-500/80" },
  valide: { label: "Valide", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600/80" },
  rejete: { label: "Rejete", variant: "destructive" },
  annule: { label: "Annule", variant: "destructive" },
}

export function EnrollmentTab({ studentId }: EnrollmentTabProps) {
  const { data, isLoading, isError, refetch } = useEnrollments({ student_id: studentId })
  const [yearFilter, setYearFilter] = useState<string>("all")

  const enrollments = data?.items ?? []

  // Extract unique academic years for the filter
  const years = useMemo(() => {
    const yearSet = new Map<string, string>()
    for (const e of enrollments) {
      const raw = e as Record<string, unknown>
      const yearName = raw.academic_year_name ? String(raw.academic_year_name) : null
      const yearId = raw.academic_year_id ? String(raw.academic_year_id) : null
      if (yearName && yearId) {
        yearSet.set(yearId, yearName)
      }
    }
    return Array.from(yearSet.entries()).map(([id, name]) => ({ id, name }))
  }, [enrollments])

  const filtered = useMemo(() => {
    if (yearFilter === "all") return enrollments
    return enrollments.filter((e) => {
      const raw = e as Record<string, unknown>
      return String(raw.academic_year_id) === yearFilter
    })
  }, [enrollments, yearFilter])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-48 rounded-md" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    )
  }

  if (isError) return <DataError message="Impossible de charger les inscriptions." onRetry={() => refetch()} />

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
          <GraduationCap className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Aucune inscription enregistree.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Year filter */}
      {years.length > 1 && (
        <div className="flex items-center gap-2">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Toutes les annees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les annees</SelectItem>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Enrollment cards */}
      <div className="space-y-3">
        {filtered.map((enrollment) => {
          const e = enrollment as Record<string, unknown>
          const status = String(e.status ?? "")
          const sc = STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const }
          const createdAt = e.created_at
            ? new Date(String(e.created_at)).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : null

          return (
            <Link key={enrollment.id} href={`/admin/enrollments/${enrollment.id}`}>
              <Card className="border-0 shadow-sm ring-1 ring-border cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {e.class_name ? String(e.class_name) : `Classe #${e.class_id ?? "?"}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.academic_year_name ? String(e.academic_year_name) : `Annee #${e.academic_year_id ?? "?"}`}
                      </p>
                      {createdAt && (
                        <p className="text-[10px] text-muted-foreground/70">
                          Inscrit le {createdAt}
                        </p>
                      )}
                    </div>
                    <Badge variant={sc.variant} className={`text-[10px] ${sc.className ?? ""}`}>
                      {sc.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
