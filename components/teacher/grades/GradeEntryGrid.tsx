"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  CircleSlash,
  Cloud,
  CloudOff,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useGrades, useUpdateGrades, useEvaluations } from "@/lib/hooks/useGrades"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { parseGradeInput, categorizeGrade, computeAverage } from "@/lib/utils/grade-parser"

type CellStatus = "idle" | "dirty" | "pending" | "saved" | "error"

interface GradeEntryGridProps {
  evaluationId: number
  /** Si fourni, affiche le hero card avec ces métadonnées */
  classId?: number
}

/**
 * Délai après la dernière modif avant l'envoi BE. 1.5s = équilibre entre
 * réactivité (user a "sauvé") et batching (groupe les frappes successives).
 */
const SAVE_DEBOUNCE_MS = 1500

/**
 * Délai après lequel un cellStatus "saved" repasse en "idle" (visuel).
 */
const SAVED_INDICATOR_MS = 2500

export function GradeEntryGrid({ evaluationId, classId }: GradeEntryGridProps) {
  const { data: grades, isLoading, error } = useGrades(evaluationId)
  // Métadonnées de l'éval — fetch la liste de la classe (cache 5 min)
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
          // Repasse en idle après 2.5s pour ne pas polluer l'UI
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
          // Garde dirty pour retry au prochain edit ou save manuel
        },
      },
    )
  }, [grades, localGrades, updateMutation])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS)
  }, [flushSave])

  // Cleanup au unmount
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
        e.returnValue = "" // Chrome exige une string vide
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  function handleGradeChange(studentId: number, rawValue: string) {
    const result = parseGradeInput(rawValue)
    // `result.value` est null pour les cas absent / invalide / vide, et un
    // number sinon. C'est exactement ce qu'on veut stocker. Les erreurs
    // (hors borne, format) seront visibles via l'UI (couleur de cellule).
    setLocalGrades((prev) => new Map(prev).set(studentId, result.value))
    dirtyStudentsRef.current.add(studentId)
    setCellStatus((prev) => new Map(prev).set(studentId, "dirty"))
    scheduleSave()
  }

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
  const isAllGraded = gradedCount === totalCount && totalCount > 0
  const dirtyCount = dirtyStudentsRef.current.size
  const classAverage = computeAverage(localGrades.values())

  return (
    <div className="space-y-5">
      {/* ─── Hero card ──────────────────────────────────────────────── */}
      {evaluation && (
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium uppercase tracking-wide text-primary">
                  {evaluation.type}
                </span>
                <span>{evaluation.subject_name}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>{evaluation.class_name}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>Trimestre {evaluation.trimester}</span>
              </div>
              <h2 className="mt-1 font-serif text-2xl tracking-tight text-foreground">
                {evaluation.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Coefficient {evaluation.coefficient} ·{" "}
                {new Date(evaluation.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Progression + Save indicator */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <KpiTile
              label="Saisies"
              value={`${gradedCount}/${totalCount}`}
              tone={isAllGraded ? "success" : "neutral"}
            />
            <KpiTile
              label="Moyenne classe"
              value={classAverage !== null ? `${classAverage.toFixed(2)}` : "—"}
              tone="neutral"
            />
            <KpiTile
              label="Statut"
              value={
                dirtyCount > 0
                  ? `${dirtyCount} non sauvé${dirtyCount > 1 ? "s" : ""}`
                  : lastSaved
                    ? "Synchronisé"
                    : "Prêt"
              }
              tone={dirtyCount > 0 ? "warning" : "success"}
              icon={dirtyCount > 0 ? CloudOff : Cloud}
            />
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isAllGraded ? "bg-emerald-500" : "bg-primary",
              )}
              style={{ width: `${totalCount > 0 ? (gradedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
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
              <Loader2
                className={cn("h-3 w-3", updateMutation.isPending && "animate-spin")}
              />
              {updateMutation.isPending ? "Synchronisation…" : "Modifications en attente"}
            </span>
          )}
        </div>
        <Button
          onClick={() => flushSave()}
          disabled={dirtyCount === 0 || updateMutation.isPending}
          size="sm"
          className="h-10 self-end sm:self-auto"
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer maintenant
        </Button>
      </div>

      {/* ─── Grade entries ──────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="divide-y">
          {grades.map((grade, index) => (
            <GradeRow
              key={grade.student_id}
              index={index}
              studentName={grade.student_name ?? `Élève #${grade.student_id}`}
              value={localGrades.get(grade.student_id) ?? null}
              status={cellStatus.get(grade.student_id) ?? "idle"}
              originalStatus={grade.status}
              onChange={(rawValue) => handleGradeChange(grade.student_id, rawValue)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string
  value: string
  tone: "success" | "warning" | "neutral"
  icon?: React.ComponentType<{ className?: string }>
}

function KpiTile({ label, value, tone, icon: Icon }: KpiTileProps) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          tone === "success" && "text-emerald-600",
          tone === "warning" && "text-amber-600",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  )
}

interface GradeRowProps {
  index: number
  studentName: string
  value: number | null
  status: CellStatus
  originalStatus: string
  onChange: (rawValue: string) => void
}

function GradeRow({ index, studentName, value, status, originalStatus, onChange }: GradeRowProps) {
  // rawInput est la source de vérité pour ce que l'utilisateur tape (incluant
  // les états transitoires comme "12," avant complétion). On l'initialise UNE
  // SEULE FOIS depuis la prop, puis le user contrôle. Pas de useEffect [value]
  // qui écraserait sa frappe (ex: "12," → parser → 12 → reset à "12" sans virgule).
  // Trade-off : si le serveur refetch avec une valeur différente, le row reste
  // sur la valeur tapée. Acceptable — single editor at a time.
  const [rawInput, setRawInput] = useState<string>(
    value !== null ? String(value).replace(".", ",") : "",
  )

  const category = categorizeGrade(value, originalStatus)
  const colorTone = useMemo(() => {
    switch (category) {
      case "difficulte":
        return {
          bg: "bg-rose-50/60",
          text: "text-rose-700",
          border: "border-rose-200",
          Icon: AlertTriangle,
          label: "En difficulté",
        }
      case "moyen":
        return {
          bg: "bg-amber-50/60",
          text: "text-amber-700",
          border: "border-amber-200",
          Icon: null,
          label: "Passable",
        }
      case "bon":
        return {
          bg: "bg-emerald-50/60",
          text: "text-emerald-700",
          border: "border-emerald-200",
          Icon: CheckCircle2,
          label: "Bon",
        }
      case "absent":
        return {
          bg: "bg-muted/40",
          text: "text-muted-foreground",
          border: "border-muted",
          Icon: CircleSlash,
          label: "Absent",
        }
      case "non_saisi":
      default:
        return {
          bg: "",
          text: "text-muted-foreground/60",
          border: "border-input",
          Icon: null,
          label: "—",
        }
    }
  }, [category])

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
        status === "saved" && "bg-emerald-50/40",
        status === "error" && "bg-destructive/5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="truncate text-sm font-medium">{studentName}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Category badge — visible quand valeur saisie, cachée en non_saisi */}
        {category !== "non_saisi" && colorTone.Icon && (
          <span
            className={cn(
              "hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex",
              colorTone.bg,
              colorTone.text,
            )}
            title={colorTone.label}
          >
            <colorTone.Icon className="h-3 w-3" />
            {colorTone.label}
          </span>
        )}

        {/* Input */}
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[,.]?[0-9]*"
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value)
              onChange(e.target.value)
            }}
            placeholder="--"
            tabIndex={index + 1}
            className={cn(
              "h-12 w-24 rounded-lg border-2 bg-background px-3 text-center text-base font-semibold tabular-nums transition-colors",
              "placeholder:font-normal placeholder:text-muted-foreground/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              status === "saved" && "border-emerald-400",
              status === "error" && "border-destructive",
              status === "pending" && "border-primary/60",
              (status === "idle" || status === "dirty") && colorTone.border,
              colorTone.text,
            )}
            aria-label={`Note de ${studentName} sur 20`}
          />
          <span className="pointer-events-none absolute -right-1 -top-1 text-[10px] text-muted-foreground/50">
            /20
          </span>
        </div>

        {/* Sync status icon */}
        <div className="flex h-5 w-5 items-center justify-center">
          {status === "pending" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {status === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
          {status === "dirty" && <span className="h-2 w-2 rounded-full bg-amber-500" />}
        </div>
      </div>
    </div>
  )
}
