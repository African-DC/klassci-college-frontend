"use client"

import { useEffect, useState } from "react"
import { CalendarClock, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScheduleOverviewRows } from "./ScheduleOverviewRows"
import {
  SCHEDULE_STATES,
  type ScheduleOverviewParams,
  type ScheduleOverviewState,
} from "@/lib/contracts/installment-overview"
import { installmentsApi } from "@/lib/api/installments"
import { useScheduleOverview } from "@/lib/hooks/useInstallments"
import { useClasses } from "@/lib/hooks/useClasses"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { downloadBlob } from "@/lib/utils"
import { formatFcfa } from "@/lib/utils/money"

const PAGE_SIZE = 20

/** Suivi des échéanciers au même endroit que leur configuration, sans page doublon. */
export function InstallmentOverview({ academicYearId }: { academicYearId: number | undefined }) {
  const { has, isLoading: permissionsLoading } = usePermissions()
  const allowed = !permissionsLoading && has("payments:read:all")
  const { data: classesData } = useClasses({ size: 100 })
  const [classValue, setClassValue] = useState("all")
  const [statusValue, setStatusValue] = useState<ScheduleOverviewState>("all")
  const [typedSearch, setTypedSearch] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(typedSearch.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [typedSearch])

  useEffect(() => {
    setPage(1)
  }, [academicYearId])

  const filter: ScheduleOverviewParams | null = allowed && academicYearId
    ? {
        academic_year_id: academicYearId,
        ...(classValue !== "all" ? { class_id: Number(classValue) } : {}),
        ...(search ? { search } : {}),
        state: statusValue,
        page,
        size: PAGE_SIZE,
      }
    : null

  const { data, isLoading, isFetching, isError, error, refetch } = useScheduleOverview(filter)
  const totalPages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1

  async function exportSchedules(format: "pdf" | "xlsx") {
    if (!filter || !data || data.total === 0 || exporting) return
    setExporting(format)
    try {
      const allFiltered = {
        academic_year_id: filter.academic_year_id,
        ...(filter.class_id ? { class_id: filter.class_id } : {}),
        ...(filter.search ? { search: filter.search } : {}),
        state: filter.state,
      }
      const blob = await installmentsApi.exportOverview(allFiltered, format)
      downloadBlob(blob, `echeanciers-${filter.academic_year_id}.${format}`)
      toast.success(format === "xlsx" ? "Échéanciers Excel téléchargés" : "Échéanciers PDF téléchargés")
    } catch (err) {
      toast.error("Export impossible", {
        description: err instanceof Error ? err.message : "Veuillez réessayer.",
      })
    } finally {
      setExporting(null)
    }
  }

  if (permissionsLoading) return <Skeleton className="h-72 rounded-2xl" />

  if (!allowed) {
    return (
      <Card className="border-border/70">
        <CardContent className="p-5 text-sm text-muted-foreground">
          La consultation des échéanciers consolidés et des dettes des familles nécessite
          la permission financière <code>payments:read:all</code>. La configuration des
          tranches reste indépendante de cet accès.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="space-y-2 border-b bg-muted/20 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock aria-hidden="true" className="h-5 w-5 text-primary" />
              Suivi des échéanciers
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Une ligne par inscription, avec la grille de l&apos;école ou l&apos;accord
              particulier de la famille. Seules les échéances arrivées à terme
              peuvent générer un retard.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
            <Button
              type="button" variant="outline" size="sm"
              className="h-10 flex-1 sm:flex-none"
              disabled={!data?.total || isFetching || Boolean(exporting)}
              onClick={() => void exportSchedules("xlsx")}
            >
              {exporting === "xlsx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Excel
            </Button>
            <Button
              type="button" variant="outline" size="sm"
              className="h-10 flex-1 sm:flex-none"
              disabled={!data?.total || isFetching || Boolean(exporting)}
              onClick={() => void exportSchedules("pdf")}
            >
              {exporting === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_13rem]">
          <div className="relative min-w-0">
            <Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Rechercher un élève ou un matricule"
              placeholder="Rechercher un élève, un matricule…"
              className="h-11 pl-9"
              value={typedSearch}
              onChange={(e) => setTypedSearch(e.target.value)}
              maxLength={100}
            />
          </div>
          <Select value={classValue} onValueChange={(v) => { setClassValue(v); setPage(1) }}>
            <SelectTrigger aria-label="Filtrer par classe" className="h-11 w-full">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {(classesData?.items ?? []).map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusValue} onValueChange={(v) => { setStatusValue(v as ScheduleOverviewState); setPage(1) }}>
            <SelectTrigger aria-label="Filtrer par état des échéanciers" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_STATES.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div aria-label="Chargement des échéanciers" className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-xl border border-destructive/30 p-5 text-sm">
            <p className="font-semibold">Le suivi des échéanciers est indisponible.</p>
            <p className="mt-1 text-muted-foreground">
              {error instanceof Error ? error.message : "Erreur de lecture"}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
              Réessayer
            </Button>
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                { label: "Inscriptions", value: String(data.totals.enrollments) },
                { label: "Élèves en retard", value: String(data.totals.late_enrollments) },
                { label: "Solde restant", value: formatFcfa(data.totals.total_remaining) },
                { label: "Retards exigibles", value: formatFcfa(data.totals.total_late) },
              ].map((item) => (
                <div key={item.label} className="min-w-0 rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 truncate text-lg font-semibold tabular-nums sm:text-xl">{item.value}</p>
                </div>
              ))}
            </div>

            {data.items.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aucun échéancier ne correspond à ces filtres.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <ScheduleOverviewRows rows={data.items} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground" role="status">
                {data.total} inscription(s) · Page {page}/{totalPages}
                {isFetching ? " · Actualisation…" : ""}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="h-10" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                  <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" /> Précédent
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-10" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>
                  Suivant <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sélectionnez une année scolaire.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Les montants sont calculés sur tous les guichets. Un reliquat non planifié ne constitue
          pas un retard tant qu&apos;aucune date limite ne lui a été attribuée.
          Les fichiers téléchargés reprennent l&apos;ensemble du filtre, et non la page affichée.
        </p>
      </CardContent>
    </Card>
  )
}
