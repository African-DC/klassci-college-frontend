"use client"

import { useMemo } from "react"
import { BookOpen, CheckCircle2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTimetable } from "@/lib/hooks/useTimetable"
import { useClassSubjectTeachers } from "@/lib/hooks/useClassSubjectTeachers"
import { useSubjects } from "@/lib/hooks/useSubjects"
import { Skeleton } from "@/components/ui/skeleton"

interface TimetableHoursSidebarProps {
  classId: number
}

interface SubjectHours {
  id: number
  name: string
  color: string | null | undefined
  required: number
  assigned: number
}

const DOT_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
  orange: "bg-orange-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  red: "bg-red-500",
  green: "bg-green-600",
  pink: "bg-pink-500",
}

// Comparaison en minutes entières : les heures décimales (0,75 + 0,75 …) ne
// doivent pas faire basculer une matière équilibrée en « dépassement ».
function volumeState(assigned: number, required: number): "empty" | "over" | "exact" | "partial" {
  if (required === 0) return "empty"
  const assignedMin = Math.round(assigned * 60)
  const requiredMin = Math.round(required * 60)
  if (assignedMin > requiredMin) return "over"
  if (assignedMin === requiredMin) return "exact"
  return "partial"
}

function getProgressColor(assigned: number, required: number): string {
  const state = volumeState(assigned, required)
  if (state === "empty") return "bg-muted-foreground"
  if (state === "over") return "bg-destructive"
  if (state === "exact") return "bg-emerald-500"
  if (assigned / required >= 0.5) return "bg-amber-500"
  return "bg-red-500"
}

function getStatusColor(assigned: number, required: number): string {
  const state = volumeState(assigned, required)
  if (state === "empty") return "text-muted-foreground"
  if (state === "over") return "text-destructive"
  if (state === "exact") return "text-emerald-600"
  if (assigned / required >= 0.5) return "text-amber-600"
  return "text-red-600"
}

function computeSlotHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh * 60 + em - sh * 60 - sm) / 60
}

function formatHours(h: number): string {
  const hours = Math.floor(h)
  const minutes = Math.round((h - hours) * 60)
  if (minutes === 0) return `${hours}h`
  return `${hours}h${String(minutes).padStart(2, "0")}`
}

export function TimetableHoursSidebar({ classId }: TimetableHoursSidebarProps) {
  const { data: slots, isLoading: slotsLoading } = useTimetable(classId)
  // Exact list of subjects in THIS class, including series restrictions.
  const { data: classAssignments, isLoading: subjectsLoading } = useClassSubjectTeachers(classId)
  const subjects = useMemo(() => classAssignments?.items ?? [], [classAssignments])
  const { data: subjectCatalog } = useSubjects({ size: 100 })
  const subjectColors = useMemo(() => new Map(subjectCatalog?.items.map((subject) => [subject.id, subject.color]) ?? []), [subjectCatalog])

  const subjectHours = useMemo<SubjectHours[]>(() => {
    if (!subjects.length) return []

    // Count assigned hours per subject from slots
    const assignedMap = new Map<number, number>()
    if (slots) {
      for (const slot of slots) {
        const hours = computeSlotHours(slot.start_time, slot.end_time)
        assignedMap.set(slot.subject_id, (assignedMap.get(slot.subject_id) ?? 0) + hours)
      }
    }

    return subjects
      .map((s) => ({
        id: s.subject_id,
        name: s.subject_name,
        color: subjectColors.get(s.subject_id),
        required: s.hours_per_week,
        assigned: assignedMap.get(s.subject_id) ?? 0,
      }))
      .sort((a, b) => {
        // Subjects with deficit first, then alphabetical
        const aDeficit = a.required - a.assigned
        const bDeficit = b.required - b.assigned
        if (aDeficit !== bDeficit) return bDeficit - aDeficit
        return a.name.localeCompare(b.name, "fr")
      })
  }, [subjects, slots, subjectColors])

  const totals = useMemo(() => {
    return subjectHours.reduce(
      (acc, s) => ({
        required: acc.required + s.required,
        assigned: acc.assigned + s.assigned,
      }),
      { required: 0, assigned: 0 },
    )
  }, [subjectHours])

  const isLoading = slotsLoading || subjectsLoading

  if (isLoading) {
    return (
      <div className="w-full shrink-0 rounded-lg border bg-card p-4 space-y-3 lg:w-[260px]">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!subjectHours.length) {
    return (
      <div className="w-full shrink-0 rounded-lg border bg-card p-4 lg:w-[260px]">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Volume horaire</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Aucune matiere trouvee pour cette classe.
        </p>
      </div>
    )
  }

  const allComplete = totals.required > 0 && subjectHours.every((s) => volumeState(s.assigned, s.required) === "exact")
  const overSubjects = subjectHours.filter((s) => volumeState(s.assigned, s.required) === "over")

  return (
    <div className="w-full shrink-0 rounded-lg border bg-card overflow-hidden lg:w-[260px]">
      {/* Header */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Volume horaire</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Requis vs assign{"\u00e9"} par mati{"\u00e8"}re
        </p>
      </div>

      {/* Subject list */}
      <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto lg:max-h-[calc(100vh-380px)]">
        {subjectHours.map((s) => {
          const pct = s.required > 0 ? Math.min((s.assigned / s.required) * 100, 100) : 0
          const progressColor = getProgressColor(s.assigned, s.required)
          const statusColor = getStatusColor(s.assigned, s.required)
          const excess = volumeState(s.assigned, s.required) === "over"

          return (
            <div key={s.id} className="space-y-1" title={excess ? `Dépassement de ${formatHours(s.assigned - s.required)}` : undefined}>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    s.color && DOT_COLORS[s.color] ? DOT_COLORS[s.color] : "bg-slate-400",
                  )}
                />
                <span className="text-xs font-medium truncate flex-1">{s.name}</span>
                <span className={cn("text-xs font-semibold tabular-nums", statusColor)}>
                  {formatHours(s.assigned)} / {formatHours(s.required)}{excess ? " ⚠" : ""}
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Total summary */}
      <div className="border-t bg-muted/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {allComplete ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span className="text-xs font-semibold">Total</span>
          </div>
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              allComplete ? "text-emerald-600" : "text-amber-600",
            )}
          >
            {formatHours(totals.assigned)} / {formatHours(totals.required)}
          </span>
        </div>
        {totals.required > 0 && (
          <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                allComplete ? "bg-emerald-500" : "bg-amber-500",
              )}
              style={{
                width: `${Math.min((totals.assigned / totals.required) * 100, 100)}%`,
              }}
            />
          </div>
        )}
        {overSubjects.length > 0 && (
          <p className="mt-2 text-xs font-medium text-destructive" role="status">
            Dépassement : {overSubjects
              .map((s) => `${s.name} (+${formatHours(s.assigned - s.required)})`).join(", ")}
          </p>
        )}
        {totals.required > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {allComplete
              ? "Tous les volumes par matière sont conformes"
              : `${formatHours(subjectHours.reduce((sum, s) => sum + Math.max(0, s.required - s.assigned), 0))} à compléter par matière${overSubjects.length > 0 ? " · Dépassement à corriger" : ""}`}
          </p>
        )}
      </div>
    </div>
  )
}
