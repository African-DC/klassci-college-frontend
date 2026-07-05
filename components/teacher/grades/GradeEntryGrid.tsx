"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Save, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useGrades, useUpdateGrades, useEvaluations } from "@/lib/hooks/useGrades"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { parseGradeInput, computeAverage } from "@/lib/utils/grade-parser"
import { GradeEntryHero } from "./entry/GradeEntryHero"
import { GradeRow, type CellStatus } from "./entry/GradeRow"

interface GradeEntryGridProps {
  evaluationId: number
  /** Si fourni, affiche le hero premium avec ces métadonnées. */
  classId?: number
  /**
   * Lien du bouton « Mode dictée ». Dépend du portail : enseignant
   * (`/teacher/...`) ou admin en saisie déléguée (`/admin/...`). À défaut côté
   * enseignant, on tombe sur la route enseignant.
   */
  dicteeHref?: string
}

/** Délai debounce après la dernière modif avant envoi BE. */
const SAVE_DEBOUNCE_MS = 1500
/** Délai après lequel un cellStatus « saved » repasse en « idle » (visuel). */
const SAVED_INDICATOR_MS = 2500

type GradeSnapshotEntry = {
  student_id: number
  value: number | null
}

export function GradeEntryGrid({ evaluationId, classId, dicteeHref }: GradeEntryGridProps) {
  const { data: grades, isLoading, error } = useGrades(evaluationId)
  const { data: evals } = useEvaluations(classId ?? 0)
  const evaluation = useMemo(
    () => evals?.find((e) => e.id === evaluationId),
    [evals, evaluationId],
  )

  const updateMutation = useUpdateGrades(evaluationId)
  const [localGrades, setLocalGrades] = useState<Map<number, number | null>>(new Map())
  const [cellStatus, setCellStatus] = useState<Map<number, CellStatus>>(new Map())
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const dirtyStudentsRef = useRef<Set<number>>(new Set())
  const localGradesRef = useRef<Map<number, number | null>>(new Map())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveInFlightRef = useRef(false)

  // ─── Sync depuis serveur ───────────────────────────────────────────────
  useEffect(() => {
    if (grades) {
      setLocalGrades((prev) => {
        const map = new Map(prev)
        grades.forEach((g) => {
          if (!dirtyStudentsRef.current.has(g.student_id)) {
            map.set(g.student_id, g.value !== null ? Number(g.value) : null)
          }
        })
        localGradesRef.current = map
        return map
      })
    }
  }, [grades])

  // ─── Save logic ────────────────────────────────────────────────────────
  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (dirtyStudentsRef.current.size === 0 || !grades) return
    if (saveInFlightRef.current) return

    const payload: GradeSnapshotEntry[] = Array.from(dirtyStudentsRef.current).map((studentId) => ({
      student_id: studentId,
      value: localGradesRef.current.get(studentId) ?? null,
    }))
    const snapshotByStudent = new Map(payload.map((entry) => [entry.student_id, entry.value]))

    setCellStatus((prev) => {
      const next = new Map(prev)
      payload.forEach((entry) => next.set(entry.student_id, "pending"))
      return next
    })

    saveInFlightRef.current = true

    try {
      await updateMutation.mutateAsync({ grades: payload })
      const confirmedStudentIds: number[] = []

      snapshotByStudent.forEach((sentValue, studentId) => {
        const currentValue = localGradesRef.current.get(studentId) ?? null
        if (Object.is(currentValue, sentValue)) {
          dirtyStudentsRef.current.delete(studentId)
          confirmedStudentIds.push(studentId)
        }
      })

      if (confirmedStudentIds.length > 0) {
        setLastSaved(new Date())
      }

      setCellStatus((prev) => {
        const next = new Map(prev)
        snapshotByStudent.forEach((sentValue, studentId) => {
          const currentValue = localGradesRef.current.get(studentId) ?? null
          next.set(studentId, Object.is(currentValue, sentValue) ? "saved" : "dirty")
        })
        return next
      })

      setTimeout(() => {
        setCellStatus((prev) => {
          const next = new Map(prev)
          confirmedStudentIds.forEach((id) => {
            if (next.get(id) === "saved") next.set(id, "idle")
          })
          return next
        })
      }, SAVED_INDICATOR_MS)
    } catch {
      setCellStatus((prev) => {
        const next = new Map(prev)
        payload.forEach((entry) => {
          const currentValue = localGradesRef.current.get(entry.student_id) ?? null
          next.set(entry.student_id, Object.is(currentValue, entry.value) ? "error" : "dirty")
        })
        return next
      })
      toast.error("Échec de la sauvegarde, réessaie")
    } finally {
      saveInFlightRef.current = false
      if (dirtyStudentsRef.current.size > 0) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          void flushSave()
        }, SAVE_DEBOUNCE_MS)
      }
    }
  }, [grades, updateMutation])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS)
  }, [flushSave])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // beforeunload warning si dirty
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (dirtyStudentsRef.current.size > 0) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const handleGradeChange = useCallback(
    (studentId: number, rawValue: string) => {
      const result = parseGradeInput(rawValue)
      const nextGrades = new Map(localGradesRef.current).set(studentId, result.value)
      localGradesRef.current = nextGrades
      setLocalGrades(nextGrades)
      dirtyStudentsRef.current.add(studentId)
      setCellStatus((prev) => new Map(prev).set(studentId, "dirty"))
      scheduleSave()
    },
    [scheduleSave],
  )

  // ─── Rendering ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  if (isLoading || !grades) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-24" />
          </div>
        ))}
      </div>
    )
  }

  const gradedCount = Array.from(localGrades.values()).filter((v) => v !== null).length
  const totalCount = grades.length
  const dirtyCount = dirtyStudentsRef.current.size
  const classAverage = computeAverage(localGrades.values())

  return (
    <div className="space-y-5">
      {evaluation && (
        <GradeEntryHero
          evaluation={evaluation}
          gradedCount={gradedCount}
          totalCount={totalCount}
          classAverage={classAverage}
          dirtyCount={dirtyCount}
          lastSaved={lastSaved}
          dicteeHref={classId ? dicteeHref ?? `/teacher/grades/${classId}/${evaluationId}/dictee` : undefined}
        />
      )}

      {/* ─── Status bar (manual save + sync indicator) ────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {lastSaved && dirtyCount === 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Sauvegardé à{" "}
              {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {dirtyCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <Loader2 className={cn("h-3 w-3", updateMutation.isPending && "animate-spin")} />
              {updateMutation.isPending ? "Synchronisation…" : "Modifications en attente"}
            </span>
          )}
        </div>
        <Button
          onClick={() => flushSave()}
          disabled={dirtyCount === 0 || updateMutation.isPending}
          size="sm"
          className="h-11 self-end sm:h-10 sm:self-auto"
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer maintenant
        </Button>
      </div>

      {/* ─── Grade entries — 1 colonne mobile, 2 colonnes desktop ─────── */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {grades.map((grade, index) => {
            const serverValue =
              grade.value !== null && grade.value !== undefined ? Number(grade.value) : null
            const liveValue = localGrades.has(grade.student_id)
              ? localGrades.get(grade.student_id) ?? null
              : serverValue
            const isLeftColumn = index % 2 === 0
            return (
              <GradeRow
                key={grade.student_id}
                index={index}
                studentName={grade.student_name ?? `Élève #${grade.student_id}`}
                initialValue={serverValue}
                value={liveValue}
                status={cellStatus.get(grade.student_id) ?? "idle"}
                originalStatus={grade.status}
                onChange={(rawValue) => handleGradeChange(grade.student_id, rawValue)}
                className={cn(
                  "border-b border-border/60",
                  isLeftColumn && "lg:border-r",
                )}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
