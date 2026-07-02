"use client"

import { useState, useCallback } from "react"
import { Download, Eye, FileSpreadsheet, Loader2, Users, UserCheck, TrendingUp, BarChart3, Building } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/utils"
import dynamic from "next/dynamic"

const EnrollmentByLevelChart = dynamic(() => import("./EnrollmentByLevelChart").then(m => m.EnrollmentByLevelChart), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
})
const SuccessRateChart = dynamic(() => import("./SuccessRateChart").then(m => m.SuccessRateChart), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
})
import { LevelStatsTable } from "./LevelStatsTable"
import { PageHero, heroAccentBtn, heroGlassBtn } from "@/components/shared/PageHero"
import { ReportsNav } from "../ReportsNav"
import { useDrenStats } from "@/lib/hooks/useDrenStats"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { drenApi } from "@/lib/api/dren"
import { openPdfPreview } from "@/lib/pdf/preview"

export function DrenPageClient() {
  const { data: academicYearsData } = useAcademicYears()
  const academicYears = academicYearsData?.items
  const [academicYearId, setAcademicYearId] = useState<number | undefined>(undefined)
  const activeYearId = academicYearId ?? academicYears?.[0]?.id
  const { data: stats, isLoading, isError } = useDrenStats(activeYearId)
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null)
  const [previewingPdf, setPreviewingPdf] = useState(false)

  // Téléchargement authentifié via blob
  const handleDownload = useCallback(async (type: "excel" | "pdf") => {
    if (!activeYearId) return
    setDownloading(type)
    try {
      const blob = type === "excel"
        ? await drenApi.downloadExcel(activeYearId)
        : await drenApi.downloadPdf(activeYearId)
      downloadBlob(blob, `stats-dren-${activeYearId}.${type === "excel" ? "xlsx" : "pdf"}`)
    } catch (err) {
      console.error(`[DREN] ${type} download failed:`, err)
      toast.error(err instanceof Error ? err.message : `Impossible de télécharger le fichier ${type.toUpperCase()}`)
    } finally {
      setDownloading(null)
    }
  }, [activeYearId])

  // Aperçu inline du PDF (même blob authentifié que le téléchargement)
  const handlePreviewPdf = useCallback(async () => {
    if (!activeYearId) return
    setPreviewingPdf(true)
    try {
      await openPdfPreview(() => drenApi.downloadPdf(activeYearId))
    } finally {
      setPreviewingPdf(false)
    }
  }, [activeYearId])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <PageHero
        icon={Building}
        title="Statistiques DREN"
        subtitle="Tableau de bord des indicateurs pour la Direction Régionale"
        actions={
          <>
            <button
              type="button"
              className={`${heroGlassBtn} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => handleDownload("excel")}
              disabled={downloading === "excel"}
            >
              {downloading === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Excel
            </button>
            <button
              type="button"
              className={`${heroGlassBtn} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={handlePreviewPdf}
              disabled={previewingPdf || !activeYearId}
              aria-label="Aperçu du PDF des statistiques DREN"
            >
              {previewingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Aperçu
            </button>
            <button
              type="button"
              className={`${heroAccentBtn} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => handleDownload("pdf")}
              disabled={downloading === "pdf"}
              aria-label="Télécharger le PDF des statistiques DREN"
            >
              {downloading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF
            </button>
          </>
        }
      />

      <ReportsNav current="dren" />

      {/* Filtre année */}
      <Select
        value={activeYearId?.toString() ?? ""}
        onValueChange={(v) => setAcademicYearId(Number(v))}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Année académique" />
        </SelectTrigger>
        <SelectContent>
          {(academicYears ?? []).map((y) => (
            <SelectItem key={y.id} value={y.id.toString()}>
              {y.name}
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
              value={stats.success_rate != null ? `${stats.success_rate.toFixed(1)}%` : "—"}
              className={stats.success_rate != null && stats.success_rate >= 60 ? "text-emerald-600" : "text-accent"}
            />
            <KpiCard
              icon={BarChart3}
              label="Garçons / Filles"
              value={`${stats.male_count} / ${stats.female_count}`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Taux d'échec"
              value={stats.failure_rate != null ? `${stats.failure_rate.toFixed(1)}%` : "—"}
            />
          </div>

          {/* Graphiques */}
          <div className="grid gap-6 lg:grid-cols-2">
            <EnrollmentByLevelChart data={stats.levels.map((l) => ({ level: l.level_name, male: l.male_count, female: l.female_count }))} />
            <SuccessRateChart data={stats.levels.map((l) => ({ level: l.level_name, rate: l.total_students > 0 ? (stats.success_rate ?? 0) : 0 }))} />
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
