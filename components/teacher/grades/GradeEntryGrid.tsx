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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Sync depuis serveur ───────────────────────────────────────────────
  useEffect(() => {
    if (grades) {
      const map = new Map<number, number | null>()
      grades.forEach((g) => map.set(g.student_id, g.value !== null ? Number(g.value) : null))
      setLocalGrades(map)
    }
  }, [grades])

  // ─── Save logic ────────────────────────────────────────────────────────
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (dirtyStudentsRef.current.size === 0 || !grades) return

    const dirtySet = dirtyStudentsRef.current
    const payload = Array.from(dirtySet).map((studentId) => ({
      student_id: studentId,
      value: localGrades.get(studentId) ?? null,
    }))

    setCellStatus((prev) => {
      const next = new Map(prev)
      dirtySet.forEach((id) => next.set(id, "pending"))
      return next
    })

    updateMutation.mutate(
      { grades: payload },
      {
        onSuccess: () => {
          setLastSaved(new Date())
          dirtyStudentsRef.current.clear()
          setCellStatus((prev) => {
            const next = new Map(prev)
            dirtySet.forEach((id) => next.set(id, "saved"))
            return next
          })
          setTimeout(() => {
            setCellStatus((prev) => {
              const next = new Map(prev)
              dirtySet.forEach((id) => {
                if (next.get(id) === "saved") next.set(id, "idle")
              })
              return next
            })
          }, SAVED_INDICATOR_MS)
        },
        onError: () => {
          setCellStatus((prev) => {
            const next = new Map(prev)
            dirtySet.forEach((id) => next.set(id, "error"))
            return next
          })
          toast.error("Échec de la sauvegarde — réessaie")
        },
      },
    )
  }, [grades, localGrades, updateMutation])

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
      setLocalGrades((prev) => new Map(prev).set(studentId, result.value))
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
