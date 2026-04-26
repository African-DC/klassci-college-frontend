"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Hourglass,
  Info,
  Plus,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEvaluations } from "@/lib/hooks/useGrades"
import { useClasses } from "@/lib/hooks/useClasses"
import { useSubjects } from "@/lib/hooks/useSubjects"
import { usePermissions } from "@/lib/hooks/usePermissions"
import type { Evaluation } from "@/lib/contracts/grade"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EvaluationCreateModal } from "./EvaluationCreateModal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TYPE_LABELS: Record<string, string> = {
  controle: "Contrôle",
  devoir: "Devoir",
  examen: "Examen",
  oral: "Oral",
}

type FilterTab = "all" | "todo" | "overdue" | "done"

function isOverdue(evaluation: Evaluation): boolean {
  const daysAgo = (Date.now() - new Date(evaluation.date).getTime()) / (1000 * 60 * 60 * 24)
  return daysAgo > 3 && evaluation.graded_students < evaluation.total_students
}

function isDone(evaluation: Evaluation): boolean {
  return evaluation.total_students > 0 && evaluation.graded_students === evaluation.total_students
}

export function GradesSupervisor() {
  const { data: classesData } = useClasses({ size: 100 })
  const classes = classesData?.items ?? []

  const { data: subjectsData } = useSubjects({ size: 100 })
  const subjects = subjectsData?.items ?? []

  const { has } = usePermissions()
  const canCreate = has("grades:write")

  const [classId, setClassId] = useState<number | null>(null)
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [trimester, setTrimester] = useState<number | null>(null)
  const [tab, setTab] = useState<FilterTab>("all")
  const [createOpen, setCreateOpen] = useState(false)

  const { data: evaluations, isLoading, error } = useEvaluations(classId ?? 0)

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

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  const noClassSelected = classId === null
  const tabsOrder: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Toutes", count: stats.total },
    { key: "todo", label: "À saisir", count: stats.todo },
    { key: "overdue", label: "En retard", count: stats.overdue },
    { key: "done", label: "Terminées", count: stats.done },
  ]

  return (
    <div className="space-y-5">
      {/* ─── Hero KPI card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Supervision des notes
            </span>
            <h1 className="mt-1 font-serif text-2xl tracking-tight">Évaluations &amp; saisies</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Suivez la progression des évaluations et saisissez au nom des enseignants si besoin.
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle évaluation
            </Button>
          )}
        </div>

        {!noClassSelected && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiTile
              label="Évaluations"
              value={String(stats.total)}
              icon={ClipboardList}
              tone="neutral"
            />
            <KpiTile
              label="Terminées"
              value={String(stats.done)}
              icon={CheckCircle2}
              tone="success"
            />
            <KpiTile
              label="En retard"
              value={String(stats.overdue)}
              icon={AlertTriangle}
              tone={stats.overdue > 0 ? "danger" : "neutral"}
            />
            <KpiTile
              label="Taux saisi"
              value={`${stats.completionRate}%`}
              icon={TrendingUp}
              tone={stats.completionRate >= 80 ? "success" : "warning"}
            />
          </div>
        )}
      </div>

      {/* ─── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Classe</label>
          <Select
            value={classId ? String(classId) : ""}
            onValueChange={(v) => setClassId(v ? Number(v) : null)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Choisir une classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                  {c.level_name ? ` · ${c.level_name}` : ""}
                  {c.series_name ? ` · ${c.series_name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Matière</label>
          <Select
            value={subjectId ? String(subjectId) : "all"}
            onValueChange={(v) => setSubjectId(v === "all" ? null : Number(v))}
            disabled={noClassSelected}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-32">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Trimestre</label>
          <Select
            value={trimester ? String(trimester) : "all"}
            onValueChange={(v) => setTrimester(v === "all" ? null : Number(v))}
            disabled={noClassSelected}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="1">T1</SelectItem>
              <SelectItem value="2">T2</SelectItem>
              <SelectItem value="3">T3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Info contextuelle (uniquement si l'user ne peut pas créer) ── */}
      {!noClassSelected && !canCreate && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-blue-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
          <p>
            Les évaluations sont créées par les enseignants depuis leur portail. Vous
            pouvez saisir les notes au nom d&apos;un enseignant en cliquant{" "}
            <span className="font-medium">«&nbsp;Saisir&nbsp;»</span> sur une évaluation
            existante.
          </p>
        </div>
      )}

      {/* ─── Tabs ──────────────────────────────────────────────────── */}
      {!noClassSelected && (
        <div className="flex flex-wrap gap-1 border-b">
          {tabsOrder.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors",
                tab === t.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    tab === t.key
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.count}
                </span>
              </span>
              {tab === t.key && (
                <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ─── Table ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Évaluation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Coeff.</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noClassSelected ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 opacity-40" />
                    <p className="text-sm">Choisissez une classe pour afficher ses évaluations</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                  Aucune évaluation ne correspond aux filtres.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((evaluation) => {
                const overdue = isOverdue(evaluation)
                const complete = isDone(evaluation)
                const progressPct =
                  evaluation.total_students > 0
                    ? (evaluation.graded_students / evaluation.total_students) * 100
                    : 0
                return (
                  <TableRow key={evaluation.id} className={cn(overdue && "bg-destructive/5")}>
                    <TableCell className="font-medium">{evaluation.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {TYPE_LABELS[evaluation.type] ?? evaluation.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{evaluation.subject_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(evaluation.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center text-sm tabular-nums">
                      {evaluation.coefficient}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              complete ? "bg-emerald-500" : overdue ? "bg-destructive" : "bg-primary",
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {evaluation.graded_students}/{evaluation.total_students}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {overdue ? (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" />
                          En retard
                        </Badge>
                      ) : complete ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Complète
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Hourglass className="h-3 w-3" />
                          En cours
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        size="sm"
                        variant={complete ? "outline" : "default"}
                        className="h-8"
                      >
                        <Link
                          href={
                            `/admin/grades/${evaluation.id}?classId=${classId}` as Route
                          }
                        >
                          <Edit3 className="mr-1 h-3 w-3" />
                          {complete ? "Réviser" : "Saisir"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

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

// ─────────────────────────────────────────────────────────────────────────
// KpiTile sub-component
// ─────────────────────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  tone: "success" | "warning" | "danger" | "neutral"
}

function KpiTile({ label, value, icon: Icon, tone }: KpiTileProps) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "success" && "text-emerald-600",
          tone === "warning" && "text-amber-600",
          tone === "danger" && "text-destructive",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  )
}
