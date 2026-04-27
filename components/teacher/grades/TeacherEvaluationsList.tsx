"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Hourglass,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherEvaluations } from "@/lib/hooks/useTeacherPortal"
import type { TeacherUpcomingEval } from "@/lib/contracts/teacher-portal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { DataError } from "@/components/shared/DataError"

const TYPE_LABELS: Record<string, string> = {
  controle: "Contrôle",
  devoir: "Devoir",
  examen: "Examen",
  oral: "Oral",
}

type FilterTab = "all" | "todo" | "overdue" | "done"

function isOverdue(evalDate: string, gradedStudents: number, totalStudents: number): boolean {
  const daysAgo = (Date.now() - new Date(evalDate).getTime()) / (1000 * 60 * 60 * 24)
  return daysAgo > 3 && gradedStudents < totalStudents
}

function isDone(gradedStudents: number, totalStudents: number): boolean {
  return totalStudents > 0 && gradedStudents === totalStudents
}

export function TeacherEvaluationsList() {
  const { data, isLoading, isError, refetch } = useTeacherEvaluations()
  const [classFilter, setClassFilter] = useState<string>("all")
  const [tab, setTab] = useState<FilterTab>("all")

  const evaluations = data ?? []

  const classes = useMemo(() => {
    const set = new Set<string>()
    evaluations.forEach((e) => set.add(e.class_name))
    return Array.from(set).sort()
  }, [evaluations])

  const filtered = useMemo(() => {
    return evaluations.filter((e) => {
      if (classFilter !== "all" && e.class_name !== classFilter) return false
      if (tab === "todo" && isDone(e.graded_students, e.total_students)) return false
      if (tab === "overdue" && !isOverdue(e.date, e.graded_students, e.total_students))
        return false
      if (tab === "done" && !isDone(e.graded_students, e.total_students)) return false
      return true
    })
  }, [evaluations, classFilter, tab])

  const stats = useMemo(() => {
    const total = evaluations.length
    const done = evaluations.filter((e) => isDone(e.graded_students, e.total_students)).length
    const overdue = evaluations.filter((e) =>
      isOverdue(e.date, e.graded_students, e.total_students),
    ).length
    return { total, done, overdue, todo: total - done }
  }, [evaluations])

  const tabsOrder: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Toutes", count: stats.total },
    { key: "todo", label: "À saisir", count: stats.todo },
    { key: "overdue", label: "En retard", count: stats.overdue },
    { key: "done", label: "Terminées", count: stats.done },
  ]

  if (isError) {
    return <DataError message="Impossible de charger les évaluations." onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-5">
      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Mes évaluations
            </span>
            <h1 className="mt-1 font-serif text-2xl tracking-tight">Notes &amp; saisies</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Suivez vos évaluations et saisissez les notes en mode classique ou en
              mode dictée vocal.
            </p>
          </div>
        </div>

        {!isLoading && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiTile label="Évaluations" value={String(stats.total)} icon={ClipboardList} tone="neutral" />
            <KpiTile label="À saisir" value={String(stats.todo)} icon={Hourglass} tone="warning" />
            <KpiTile
              label="En retard"
              value={String(stats.overdue)}
              icon={AlertTriangle}
              tone={stats.overdue > 0 ? "danger" : "neutral"}
            />
            <KpiTile label="Terminées" value={String(stats.done)} icon={CheckCircle2} tone="success" />
          </div>
        )}
      </div>

      {/* ─── Filtres ──────────────────────────────────────────────── */}
      {!isLoading && evaluations.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-[160px] max-w-xs">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Classe</label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ─── Tabs ─────────────────────────────────────────────────── */}
      {!isLoading && evaluations.length > 0 && (
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

      {/* ─── Liste ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Évaluation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Matière</TableHead>
              <TableHead className="hidden lg:table-cell">Classe</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
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
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-8 w-8 opacity-40" />
                    <p className="text-sm">
                      {evaluations.length === 0
                        ? "Aucune évaluation pour le moment. Demandez à un admin d'en créer une au besoin."
                        : "Aucune évaluation ne correspond aux filtres."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((evaluation) => (
                <EvaluationRow key={evaluation.id} evaluation={evaluation} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface EvaluationRowProps {
  evaluation: TeacherUpcomingEval
}

function EvaluationRow({ evaluation }: EvaluationRowProps) {
  const overdue = isOverdue(evaluation.date, evaluation.graded_students, evaluation.total_students)
  const complete = isDone(evaluation.graded_students, evaluation.total_students)
  const progressPct =
    evaluation.total_students > 0
      ? (evaluation.graded_students / evaluation.total_students) * 100
      : 0

  return (
    <TableRow className={cn(overdue && "bg-destructive/5")}>
      <TableCell className="font-medium">{evaluation.title}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-[10px] uppercase">
          {TYPE_LABELS[evaluation.type] ?? evaluation.type}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm">{evaluation.subject_name}</TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        {evaluation.class_name}
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
        {new Date(evaluation.date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })}
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
          <Link href={`/teacher/grades/${evaluation.class_id}/${evaluation.id}` as Route}>
            <Edit3 className="mr-1 h-3 w-3" />
            {complete ? "Réviser" : "Saisir"}
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  )
}

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
