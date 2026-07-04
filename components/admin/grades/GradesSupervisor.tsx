"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Info,
  Loader2,
  Plus,
  TrendingUp,
} from "lucide-react"
import { PageHero, heroAccentBtn } from "@/components/shared/PageHero"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiFetchBlob } from "@/lib/api/client"
import { openPdfPreview } from "@/lib/pdf/preview"
import {
  fileSafeName,
  triggerBlobDownload,
} from "@/components/admin/classes/detail/class-downloads"
import { useEvaluations } from "@/lib/hooks/useGrades"
import { useClasses } from "@/lib/hooks/useClasses"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { EvaluationCreateModal } from "./EvaluationCreateModal"
import { GradesFilters } from "./GradesFilters"
import { GradesTable } from "./GradesTable"
import { TAB_LABELS, isDone, isOverdue, type FilterTab } from "./grades-helpers"

export function GradesSupervisor() {
  const { data: classesData } = useClasses({ size: 100 })
  const classes = classesData?.items ?? []

  const [classId, setClassId] = useState<number | null>(null)
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [trimester, setTrimester] = useState<number | null>(null)
  const [tab, setTab] = useState<FilterTab>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [downloadingSheet, setDownloadingSheet] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  const { data: yearsData } = useAcademicYears()
  const years = yearsData?.items ?? []
  const currentYear = years.find((y) => y.is_current) ?? years[0]
  const ayId = currentYear?.id

  const { has } = usePermissions()
  const canCreate = has("grades:write")

  const { data: evaluations, isLoading, error } = useEvaluations(classId ?? 0)

  const noClass = classId === null

  // Les matières du filtre sont dérivées des évaluations réellement présentes
  // dans la classe (dédupliquées par nom). C'est robuste au mélange
  // catalogue/instance : une évaluation peut référencer l'entrée générique
  // (sans niveau) ou l'instance de niveau, deux subject_id pour le même nom.
  const subjectOptions = useMemo(() => {
    const byName = new Map<string, { id: number; name: string }>()
    for (const e of evaluations ?? []) {
      if (!byName.has(e.subject_name)) {
        byName.set(e.subject_name, { id: e.subject_id, name: e.subject_name })
      }
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"))
  }, [evaluations])

  const selectedSubjectName = useMemo(
    () => subjectOptions.find((s) => s.id === subjectId)?.name ?? null,
    [subjectOptions, subjectId],
  )

  // Périmètre = évaluations filtrées par matière + trimestre (hors onglet).
  // Sert de base aux compteurs d'onglets ET aux KPIs, qui suivent donc les filtres.
  const scoped = useMemo(() => {
    return (evaluations ?? []).filter((e) => {
      if (selectedSubjectName && e.subject_name !== selectedSubjectName) return false
      if (trimester && e.trimester !== trimester) return false
      return true
    })
  }, [evaluations, selectedSubjectName, trimester])

  const filtered = useMemo(() => {
    return scoped.filter((e) => {
      if (tab === "todo" && isDone(e)) return false
      if (tab === "overdue" && !isOverdue(e)) return false
      if (tab === "done" && !isDone(e)) return false
      return true
    })
  }, [scoped, tab])

  const stats = useMemo(() => {
    const total = scoped.length
    const done = scoped.filter(isDone).length
    const overdue = scoped.filter(isOverdue).length
    const todo = total - done
    const totalGraded = scoped.reduce((sum, e) => sum + e.graded_students, 0)
    const totalExpected = scoped.reduce((sum, e) => sum + e.total_students, 0)
    const completionRate = totalExpected > 0 ? Math.round((totalGraded / totalExpected) * 100) : 0
    return { total, done, overdue, todo, completionRate }
  }, [scoped])

  const dash = "—"
  const kpis = [
    { label: "Évaluations", value: noClass ? dash : String(stats.total), icon: ClipboardList },
    { label: "Terminées", value: noClass ? dash : String(stats.done), icon: CheckCircle2 },
    { label: "En retard", value: noClass ? dash : String(stats.overdue), icon: AlertTriangle },
    {
      label: "Taux saisi",
      value: noClass ? dash : `${stats.completionRate}%`,
      icon: TrendingUp,
    },
  ]

  // Relevé de notes rempli : n'a de sens que par matière ET trimestre précis.
  const reportReady = classId != null && subjectId != null && trimester != null && ayId != null
  const reportClassName = classes.find((c) => c.id === classId)?.name
  const reportSubjectName = selectedSubjectName
  const reportFilename = `releve-notes-${fileSafeName(
    reportClassName ?? "classe",
  )}-${fileSafeName(reportSubjectName ?? "matiere")}-T${trimester}.pdf`
  const sheetFilename = `feuille-notes-vierge-${fileSafeName(reportClassName ?? "classe")}.pdf`

  const fetchGradeReport = () =>
    apiFetchBlob(
      `/reports/classes/${classId}/grade-report?subject_id=${subjectId}&trimester=${trimester}&academic_year_id=${ayId}`,
    )

  const fetchGradeSheet = () => {
    const params = new URLSearchParams()
    if (subjectId) params.set("subject_id", String(subjectId))
    if (trimester) params.set("trimester", String(trimester))
    const qs = params.toString()
    return apiFetchBlob(`/admin/classes/${classId}/grade-sheet${qs ? `?${qs}` : ""}`)
  }

  async function handlePreview() {
    if (!reportReady) return
    setPreviewing(true)
    try {
      await openPdfPreview(fetchGradeReport)
    } finally {
      setPreviewing(false)
    }
  }

  async function handleGradeReport() {
    if (!reportReady) return
    setDownloadingReport(true)
    try {
      triggerBlobDownload(await fetchGradeReport(), reportFilename)
    } catch (err) {
      toast.error("Téléchargement impossible", {
        description: err instanceof Error ? err.message : "Erreur lors de la génération du PDF",
      })
    } finally {
      setDownloadingReport(false)
    }
  }

  async function handleGradeSheet() {
    if (noClass) return
    setDownloadingSheet(true)
    try {
      triggerBlobDownload(await fetchGradeSheet(), sheetFilename)
    } catch (err) {
      toast.error("Téléchargement impossible", {
        description: err instanceof Error ? err.message : "Erreur lors de la génération du PDF",
      })
    } finally {
      setDownloadingSheet(false)
    }
  }

  const anyDocBusy = downloadingReport || downloadingSheet || previewing

  const tabsOrder: { key: FilterTab; count: number }[] = [
    { key: "all", count: stats.total },
    { key: "todo", count: stats.todo },
    { key: "overdue", count: stats.overdue },
    { key: "done", count: stats.done },
  ]

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHero
        icon={ClipboardList}
        title="Évaluations & saisies"
        subtitle="Suivez la progression des évaluations et saisissez au nom des enseignants si besoin."
        kpis={kpis}
        actions={
          canCreate ? (
            <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle évaluation
            </button>
          ) : undefined
        }
      />

      {/* Filtres + actions documentaires */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <GradesFilters
              classes={classes}
              subjects={subjectOptions}
              classId={classId}
              subjectId={subjectId}
              trimester={trimester}
              onClassChange={(id) => {
                setClassId(id)
                setSubjectId(null)
              }}
              onSubjectChange={setSubjectId}
              onTrimesterChange={setTrimester}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={noClass}
                  className="h-11 sm:h-10"
                  aria-label="Relevé de notes"
                >
                  {anyDocBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  Relevé de notes
                  <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Relevé rempli</DropdownMenuLabel>
                <DropdownMenuItem disabled={!reportReady || previewing} onClick={handlePreview}>
                  <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                  Aperçu du relevé
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!reportReady || downloadingReport}
                  onClick={handleGradeReport}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Télécharger le relevé (PDF)
                </DropdownMenuItem>
                {!reportReady && (
                  <p className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
                    Choisissez une classe, une matière et un trimestre pour le relevé rempli.
                  </p>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Feuille vierge</DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={noClass || downloadingSheet}
                  onClick={handleGradeSheet}
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  Feuille de notes vierge (PDF)
                </DropdownMenuItem>
                <p className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
                  Liste des élèves à remplir à la main. Matière et trimestre pré-remplis si choisis.
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {noClass && (
            <p className="text-[11px] text-muted-foreground">
              Choisissez d&apos;abord une classe pour filtrer les matières et afficher les
              évaluations.
            </p>
          )}

          {!noClass && !canCreate && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
              <p>
                Les évaluations sont créées par les enseignants depuis leur portail. Vous pouvez
                saisir les notes au nom d&apos;un enseignant via{" "}
                <span className="font-medium">«&nbsp;Saisir&nbsp;»</span>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onglets de filtrage */}
      {!noClass && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            {tabsOrder.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
                {TAB_LABELS[t.key]}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {t.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <GradesTable
        evaluations={filtered}
        isLoading={isLoading}
        noClassSelected={noClass}
        classId={classId}
      />

      {canCreate && (
        <EvaluationCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          defaultClassId={classId}
        />
      )}
    </div>
  )
}
