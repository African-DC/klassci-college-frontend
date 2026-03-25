"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, Users, UserCheck, TrendingUp, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EnrollmentByLevelChart } from "./EnrollmentByLevelChart"
import { SuccessRateChart } from "./SuccessRateChart"
import { LevelStatsTable } from "./LevelStatsTable"
import { useDrenStats } from "@/lib/hooks/useDrenStats"

// Données de démo — sera remplacé par l'API /academic-years
const DEMO_ACADEMIC_YEARS = [
  { id: 1, label: "2025-2026" },
  { id: 2, label: "2024-2025" },
]

export function DrenPageClient() {
  const [academicYearId, setAcademicYearId] = useState<number>(DEMO_ACADEMIC_YEARS[0].id)
  const { data: stats, isLoading, isError } = useDrenStats(academicYearId)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Statistiques DREN</h1>
          <p className="text-sm text-muted-foreground">
            Tableau de bord des indicateurs pour la Direction Régionale
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`${baseUrl}/reports/dren/excel?academic_year_id=${academicYearId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`${baseUrl}/reports/dren/pdf?academic_year_id=${academicYearId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </a>
          </Button>
        </div>
      </div>

      {/* Filtre année */}
      <Select
        value={academicYearId.toString()}
        onValueChange={(v) => setAcademicYearId(Number(v))}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Année académique" />
        </SelectTrigger>
        <SelectContent>
          {DEMO_ACADEMIC_YEARS.map((y) => (
            <SelectItem key={y.id} value={y.id.toString()}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Contenu */}
      {isLoading ? (
        <DrenSkeleton />
      ) : isError ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Impossible de charger les statistiques.
        </div>
      ) : stats ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              icon={Users}
              label="Effectif total"
              value={stats.total_students.toLocaleString("fr-FR")}
            />
            <KpiCard
              icon={UserCheck}
              label="Taux de réussite"
              value={`${stats.overall_success_rate.toFixed(1)}%`}
              className={stats.overall_success_rate >= 60 ? "text-emerald-600" : "text-accent"}
            />
            <KpiCard
              icon={BarChart3}
              label="Garçons / Filles"
              value={`${stats.total_male} / ${stats.total_female}`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Moyenne générale"
              value={stats.overall_average !== null ? stats.overall_average.toFixed(2) : "—"}
            />
          </div>

          {/* Graphiques */}
          <div className="grid gap-6 lg:grid-cols-2">
            <EnrollmentByLevelChart data={stats.gender_distribution} />
            <SuccessRateChart data={stats.success_rates} />
          </div>

          {/* Tableau détaillé */}
          <LevelStatsTable data={stats.levels} />
        </>
      ) : null}
    </div>
  )
}

// Carte KPI
function KpiCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  className?: string
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${className ?? ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton de chargement
function DrenSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
