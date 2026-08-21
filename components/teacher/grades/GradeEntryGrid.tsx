"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Save, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useGrades, useUpdateGrades, useEvaluation } from "@/lib/hooks/useGrades"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { parseGradeInput, computeAverage } from "@/lib/utils/grade-parser"
import {
  absenceWouldOverwriteGrade,
  canLiftAbsence,
  gradeStatesEqual,
  normalizeGradeState,
  reconcileGradeSave,
  toGradePayloadEntry,
  type GradeEntryState,
} from "@/lib/utils/grade-reconciliation"
import { GradeEntryHero } from "./entry/GradeEntryHero"
import { GradeRow, type CellStatus } from "./entry/GradeRow"
import {
  AbsenceGuardDialog,
  ABSENCE_LIFT_RULE,
  type AbsenceGuard,
} from "./entry/AbsenceGuardDialog"

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
  /**
   * Écran des autorisations de reprise, quand le portail y donne accès. Sert à
   * renvoyer l'administration au bon endroit quand elle bute sur un zéro
   * d'office. L'enseignant n'a pas ce droit : il reçoit l'explication seule.
   */
  retakesHref?: string
}

/** Délai debounce après la dernière modif avant envoi BE. */
const SAVE_DEBOUNCE_MS = 1500
/** Délai après lequel un cellStatus « saved » repasse en « idle » (visuel). */
const SAVED_INDICATOR_MS = 2500

export function GradeEntryGrid({
  evaluationId,
  classId,
  dicteeHref,
  retakesHref,
}: GradeEntryGridProps) {
  const { data: grades, isLoading, error } = useGrades(evaluationId)
  const { data: evaluation } = useEvaluation(evaluationId)

  const updateMutation = useUpdateGrades(evaluationId)
  const [localGrades, setLocalGrades] = useState<Map<number, number | null>>(new Map())
  const [cellStatus, setCellStatus] = useState<Map<number, CellStatus>>(new Map())
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [absentStudents, setAbsentStudents] = useState<Set<number>>(new Set())
  const [absenceGuard, setAbsenceGuard] = useState<{
    studentId: number
    guard: AbsenceGuard
  } | null>(null)
  const dirtyStudentsRef = useRef<Set<number>>(new Set())
  const localGradesRef = useRef<Map<number, number | null>>(new Map())
  const absentStudentsRef = useRef<Set<number>>(new Set())
  // Statut réellement enregistré côté serveur, par élève. C'est lui qui décide
  // si la case « Abs. » peut encore être décochée.
  const serverStatusRef = useRef<Map<number, string>>(new Map())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveInFlightRef = useRef(false)

  // ─── Sync depuis serveur ───────────────────────────────────────────────
  useEffect(() => {
    if (grades) {
      serverStatusRef.current = new Map(grades.map((g) => [g.student_id, g.status]))
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
      // Les élèves déjà marqués absents côté serveur repartent cochés, sauf
      // ceux que l'enseignant vient de modifier sans avoir encore sauvegardé.
      setAbsentStudents((prev) => {
        const next = new Set(prev)
        grades.forEach((g) => {
          if (dirtyStudentsRef.current.has(g.student_id)) return
          if (g.status === "absent") next.add(g.student_id)
          else next.delete(g.student_id)
        })
        absentStudentsRef.current = next
        return next
      })
    }
  }, [grades])

  // Ce qui partira réellement au serveur pour cet élève : la note ET le zéro
  // d'office, jamais l'un sans l'autre. Sert à construire le lot ET à vérifier
  // ensuite que rien n'a bougé pendant l'envoi. Comparer la seule valeur
  // laisserait passer pour « enregistré » un décochage que le backend a refusé.
  const pendingStateFor = useCallback((studentId: number): GradeEntryState => {
    return normalizeGradeState({
      value: localGradesRef.current.get(studentId) ?? null,
      absent: absentStudentsRef.current.has(studentId),
    })
  }, [])

  // ─── Save logic ────────────────────────────────────────────────────────
  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (dirtyStudentsRef.current.size === 0 || !grades) return
    if (saveInFlightRef.current) return

    const payload = Array.from(dirtyStudentsRef.current).map((studentId) =>
      toGradePayloadEntry(studentId, pendingStateFor(studentId)),
    )
    const sentByStudent = new Map<number, GradeEntryState>(
      payload.map((entry) => [entry.student_id, { value: entry.value, absent: entry.absent }]),
    )

    setCellStatus((prev) => {
      const next = new Map(prev)
      payload.forEach((entry) => next.set(entry.student_id, "pending"))
      return next
    })

    saveInFlightRef.current = true

    try {
      const updated = await updateMutation.mutateAsync({ grades: payload })
      const statusByStudent = new Map(updated.map((g) => [g.student_id, g.status]))
      // Ce que le serveur vient d'écrire fait foi tout de suite : la case
      // « Abs. » doit se verrouiller sans attendre le prochain rafraîchissement.
      serverStatusRef.current = statusByStudent
      const confirmedStudentIds: number[] = []
      const refusedStudentIds: number[] = []
      const outcomes = new Map<number, CellStatus>()

      sentByStudent.forEach((sent, studentId) => {
        const outcome = reconcileGradeSave({
          sent,
          current: pendingStateFor(studentId),
          serverStatus: statusByStudent.get(studentId),
        })
        if (outcome === "saved") {
          dirtyStudentsRef.current.delete(studentId)
          confirmedStudentIds.push(studentId)
          outcomes.set(studentId, "saved")
        } else if (outcome === "refused") {
          // Le backend a gardé le zéro d'office. Renvoyer la même chose
          // échouerait à l'identique : on sort la ligne de la file d'attente,
          // on la marque en erreur et on dit pourquoi. Rien n'est vert.
          dirtyStudentsRef.current.delete(studentId)
          refusedStudentIds.push(studentId)
          outcomes.set(studentId, "error")
        } else {
          outcomes.set(studentId, "dirty")
        }
      })

      if (refusedStudentIds.length > 0) {
        // La case doit redire ce qui est réellement enregistré, sinon l'écran
        // laisse croire que le zéro d'office a été levé.
        const restored = new Set(absentStudentsRef.current)
        refusedStudentIds.forEach((id) => restored.add(id))
        absentStudentsRef.current = restored
        setAbsentStudents(restored)
        toast.error("Zéro d'office conservé", { description: ABSENCE_LIFT_RULE })
      }

      if (confirmedStudentIds.length > 0) {
        setLastSaved(new Date())
      }

      setCellStatus((prev) => {
        const next = new Map(prev)
        outcomes.forEach((status, studentId) => next.set(studentId, status))
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
        sentByStudent.forEach((sent, studentId) => {
          // Ligne inchangée depuis l'envoi : c'est bien celle qui a échoué.
          // Retouchée entre-temps : elle repart au prochain envoi.
          const stillTheSame = gradeStatesEqual(sent, pendingStateFor(studentId))
          next.set(studentId, stillTheSame ? "error" : "dirty")
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
  }, [grades, updateMutation, pendingStateFor])

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

  const applyAbsent = useCallback(
    (studentId: number, next: boolean) => {
      const updated = new Set(absentStudentsRef.current)
      if (next) updated.add(studentId)
      else updated.delete(studentId)
      absentStudentsRef.current = updated
      setAbsentStudents(updated)
      dirtyStudentsRef.current.add(studentId)
      setCellStatus((prev) => new Map(prev).set(studentId, "dirty"))
      scheduleSave()
    },
    [scheduleSave],
  )

  const setGradeValue = useCallback(
    (studentId: number, value: number | null) => {
      const nextGrades = new Map(localGradesRef.current).set(studentId, value)
      localGradesRef.current = nextGrades
      setLocalGrades(nextGrades)
      dirtyStudentsRef.current.add(studentId)
      setCellStatus((prev) => new Map(prev).set(studentId, "dirty"))
      scheduleSave()
    },
    [scheduleSave],
  )

  const handleGradeChange = useCallback(
    (studentId: number, rawValue: string) => {
      const result = parseGradeInput(rawValue)
      if (result.absent) {
        // Taper « absent » dans la case vaut la case cochée et vaut le mot dit
        // à voix haute en dictée : les trois façons de l'exprimer doivent
        // enregistrer la même chose. Pas de confirmation ici, l'enseignant
        // écrit littéralement par-dessus la note qu'il remplace.
        applyAbsent(studentId, true)
        return
      }
      setGradeValue(studentId, result.value)
    },
    [applyAbsent, setGradeValue],
  )

  const handleAbsentChange = useCallback(
    (studentId: number, studentName: string, next: boolean) => {
      if (!next && !canLiftAbsence(serverStatusRef.current.get(studentId))) {
        // Le zéro d'office est déjà enregistré : le backend refusera, et de
        // deux façons également silencieuses. Autant nommer la règle ici.
        setAbsenceGuard({ studentId, guard: { kind: "lift-blocked", studentName } })
        return
      }
      const localValue = localGradesRef.current.get(studentId) ?? null
      const wouldOverwrite = absenceWouldOverwriteGrade({
        value: localValue,
        absent: absentStudentsRef.current.has(studentId),
      })
      if (next && wouldOverwrite && localValue !== null) {
        setAbsenceGuard({
          studentId,
          guard: { kind: "overwrite", studentName, value: localValue },
        })
        return
      }
      applyAbsent(studentId, next)
    },
    [applyAbsent],
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

      <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Cochez « Abs. » pour un élève absent le jour de l&apos;épreuve : la note vaut zéro et
        compte dans la moyenne. Une case laissée vide veut seulement dire « pas encore corrigé ».
        {" "}
        {ABSENCE_LIFT_RULE}
      </p>

      {/* ─── Grade entries — 1 colonne mobile, 2 colonnes desktop ─────── */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {grades.map((grade, index) => {
            const serverValue =
              grade.value !== null && grade.value !== undefined ? Number(grade.value) : null
            const liveValue = localGrades.has(grade.student_id)
              ? localGrades.get(grade.student_id) ?? null
              : serverValue
            const studentName = grade.student_name ?? `Élève #${grade.student_id}`
            const isLeftColumn = index % 2 === 0
            return (
              <GradeRow
                key={grade.student_id}
                index={index}
                studentName={studentName}
                initialValue={serverValue}
                value={liveValue}
                status={cellStatus.get(grade.student_id) ?? "idle"}
                originalStatus={grade.status}
                onChange={(rawValue) => handleGradeChange(grade.student_id, rawValue)}
                absent={absentStudents.has(grade.student_id)}
                onAbsentChange={(next) =>
                  handleAbsentChange(grade.student_id, studentName, next)
                }
                className={cn(
                  "border-b border-border/60",
                  isLeftColumn && "lg:border-r",
                )}
              />
            )
          })}
        </div>
      </div>

      <AbsenceGuardDialog
        guard={absenceGuard?.guard ?? null}
        retakesHref={retakesHref}
        onCancel={() => setAbsenceGuard(null)}
        onConfirm={() => {
          if (absenceGuard) applyAbsent(absenceGuard.studentId, true)
          setAbsenceGuard(null)
        }}
      />
    </div>
  )
}
