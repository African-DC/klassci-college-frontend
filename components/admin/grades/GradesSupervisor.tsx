"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
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
import { ExportMenu } from "@/components/export/ExportMenu"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { apiFetchBlob } from "@/lib/api/client"
import {
  fileSafeName,
  triggerBlobDownload,
} from "@/components/admin/classes/detail/class-downloads"
import { useEvaluations } from "@/lib/hooks/useGrades"
import { useClasses } from "@/lib/hooks/useClasses"
import { useSubjects } from "@/lib/hooks/useSubjects"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useSettings } from "@/lib/hooks/useSettings"
import { EvaluationCreateModal } from "./EvaluationCreateModal"
import { buildGradesExportPayload } from "./grades-export"
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

  // Cascade : les matières sont filtrées par la classe (niveau + série). On
  // n'affiche que les INSTANCES (level_id défini), pas l'entrée catalogue, pour
  // ne montrer que les matières réellement enseignées dans cette classe.
  const { data: subjectsData } = useSubjects(
    classId ? { class_id: classId, size: 100 } : { size: 100 },
  )
  const subjects = useMemo(() => {
    const raw = subjectsData?.items ?? []
    const instances = raw.filter((s) => s.level_id !== null)
    return instances.length > 0 ? instances : raw
  }, [subjectsData])

  const { data: yearsData } = useAcademicYears()
  const years = yearsData?.items ?? []
  const currentYear = years.find((y) => y.is_current) ?? years[0]
  const ayId = currentYear?.id

  const { has } = usePermissions()
  const canCreate = has("grades:write")
  const { data: settings } = useSettings()

  const { data: evaluations, isLoading, error } = useEvaluations(classId ?? 0)

  const noClass = classId === null

  const filtered = useMemo(() => {
    if (!evaluations) return []
    return evaluations.filter((e) => {
      if (subjectId && e.subject_id !== subjectId) return false
      if (trimester && e.trimester !== trimester) return false
      if (tab === "todo" && isDone(e)) return false
      if (tab === "overdue" && !isOverdue(e)) return false
      if (tab === "done" && !isDone(e)) return false
      return true
    })
  }, [evaluations, subjectId, trimester, tab])

  const stats = useMemo(() => {
    const list = evaluations ?? []
    const total = list.length
    const done = list.filter(isDone).length
    const overdue = list.filter(isOverdue).length
    const todo = total - done
    const totalGraded = list.reduce((sum, e) => sum + e.graded_students, 0)
    const totalExpected = list.reduce((sum, e) => sum + e.total_students, 0)
    const completionRate = totalExpected > 0 ? Math.round((totalGraded / totalExpected) * 100) : 0
    return { total, done, overdue, todo, completionRate }
  }, [evaluations])

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
  const reportSubjectName = subjects.find((s) => s.id === subjectId)?.name
  const reportLabel = `le relevé de notes${
    reportClassName ? ` de la classe ${reportClassName}` : ""
  }${reportSubjectName ? ` en ${reportSubjectName}` : ""}${trimester ? ` (T${trimester})` : ""}`
  const reportFilename = `releve-notes-${fileSafeName(
    reportClassName ?? "classe",
  )}-${fileSafeName(reportSubjectName ?? "matiere")}-T${trimester}.pdf`
  const reportHint = "Choisir une classe, une matière et un trimestre"

  const fetchGradeReport = () =>
    apiFetchBlob(
      `/reports/classes/${classId}/grade-report?subject_id=${subjectId}&trimester=${trimester}&academic_year_id=${ayId}`,
    )

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

  const exportFilters = (() => {
    const parts: string[] = []
    if (reportClassName) parts.push(`Classe ${reportClassName}`)
    if (reportSubjectName) parts.push(reportSubjectName)
    if (trimester) parts.push(`T${trimester}`)
    if (tab !== "all") parts.push(TAB_LABELS[tab])
    return parts.length > 0 ? parts.join(" · ") : undefined
  })()

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
              subjects={subjects}
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
            <div
              className="flex flex-wrap items-center gap-2"
              title={reportReady ? undefined : reportHint}
            >
              <PdfPreviewButton
                fetchBlob={fetchGradeReport}
                label={reportLabel}
                disabled={!reportReady}
                className="h-11 sm:h-10"
              />
              <Button
                variant="outline"
                onClick={handleGradeReport}
                disabled={!reportReady || downloadingReport}
                aria-label="Télécharger le relevé de notes"
                title={reportReady ? undefined : reportHint}
                className="h-11 sm:h-10"
              >
                {downloadingReport ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Relevé (PDF)
              </Button>
              <ExportMenu
                filename="notes"
                disabled={noClass || filtered.length === 0}
                getPayload={() =>
                  buildGradesExportPayload({
                    evaluations: filtered,
                    settings,
                    filters: exportFilters,
                  })
                }
              />
            </div>
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
