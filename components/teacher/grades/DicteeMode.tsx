"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mic,
  MicOff,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useGrades, useUpdateGrades, useEvaluations } from "@/lib/hooks/useGrades"
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition"
import { parseSpokenGrade, detectCommand } from "@/lib/utils/voice-grade-parser"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type EntryValue = number | null | undefined // undefined = pas saisi, null = absent, number = note

interface DicteeModeProps {
  evaluationId: number
  classId: number
}

/**
 * Mode Dictée — saisie vocale plein écran, optimisée pour Mme Diallo (52, Itel S661).
 *
 * Flow :
 *   1) Click "Activer le micro" → permission + listening
 *   2) "douze virgule cinq" → display la note pour l'élève courant
 *   3) "suivant" (ou tap →) → next student
 *   4) Boucle jusqu'au dernier → écran récap
 *   5) Click "Enregistrer" → batch update vers BE
 *
 * Optimisations :
 *   - text-9xl pour le chiffre (visibilité plein soleil sur écran TFT)
 *   - touch targets >= 64px hauteur (h-16) sur mobile
 *   - fond noir → réduit conso batterie OLED, meilleur contraste plein soleil
 *   - beep audio sur succès (feedback non-visuel pour saisie sans regarder)
 *   - fallback total au tap : tout est utilisable sans micro
 */
export function DicteeMode({ evaluationId, classId }: DicteeModeProps) {
  const router = useRouter()
  const { data: grades, isLoading } = useGrades(evaluationId)
  const { data: evals } = useEvaluations(classId)
  const evaluation = useMemo(
    () => evals?.find((e) => e.id === evaluationId),
    [evals, evaluationId],
  )

  const updateMutation = useUpdateGrades(evaluationId)

  const [entries, setEntries] = useState<Map<number, EntryValue>>(new Map())
  const [currentIdx, setCurrentIdx] = useState(0)
  const [mode, setMode] = useState<"entering" | "recap">("entering")
  const [transcriptDisplay, setTranscriptDisplay] = useState("")
  const [feedback, setFeedback] = useState<"ok" | "error" | null>(null)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)

  // ─── Bootstrap depuis serveur ──────────────────────────────────────────
  useEffect(() => {
    if (grades) {
      const map = new Map<number, EntryValue>()
      grades.forEach((g) => {
        // Pré-remplit depuis serveur : value !== null OU status === "absent"
        // Le contrat actuel renvoie value: null + status: "entered" pour absent.
        if (g.value !== null) {
          map.set(g.student_id, Number(g.value))
        } else if (g.status === "entered") {
          map.set(g.student_id, null) // absent
        }
        // sinon : laissé undefined (à saisir)
      })
      setEntries(map)
    }
  }, [grades])

  // ─── Beep audio (succès) ───────────────────────────────────────────────
  // iOS Safari interdit la création d'AudioContext hors user-gesture chain.
  // On l'instancie dans `ensureAudio()` (appelée depuis le bouton mic = user
  // gesture). Si l'AudioContext devient "suspended" entre 2 beeps, on le
  // resume — toujours dans le bon scope car `beep` est appelé dans la
  // continuité d'un onResult vocal qui hérite du gesture initial.
  const audioCtxRef = useRef<AudioContext | null>(null)
  const ensureAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return null
    try {
      audioCtxRef.current = new Ctx()
      return audioCtxRef.current
    } catch {
      return null
    }
  }, [])
  const beep = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      if (ctx.state === "suspended") {
        // Fire-and-forget — resume() returns a Promise we don't need to await.
        void ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // Audio unavailable — silent fallback (non-critical UX feedback).
    }
  }, [])

  const totalStudents = grades?.length ?? 0
  const currentStudent = grades?.[currentIdx]
  const currentValue = currentStudent ? entries.get(currentStudent.student_id) : undefined

  const setEntry = useCallback(
    (studentId: number, value: EntryValue) => {
      setEntries((prev) => {
        const next = new Map(prev)
        next.set(studentId, value)
        return next
      })
    },
    [],
  )

  const goNext = useCallback(() => {
    if (currentIdx < totalStudents - 1) {
      setCurrentIdx((i) => i + 1)
      setTranscriptDisplay("")
      setFeedback(null)
    } else {
      setMode("recap")
    }
  }, [currentIdx, totalStudents])

  const goPrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1)
      setTranscriptDisplay("")
      setFeedback(null)
    }
  }, [currentIdx])

  // ─── Voice handler ─────────────────────────────────────────────────────
  const handleTranscript = useCallback(
    (transcript: string) => {
      setTranscriptDisplay(transcript)
      const cmd = detectCommand(transcript)
      if (cmd === "next") {
        goNext()
        return
      }
      if (cmd === "prev") {
        goPrev()
        return
      }
      if (cmd === "exit") {
        if (currentIdx >= totalStudents - 1) setMode("recap")
        else setMode("recap") // sortir = aller au récap pour valider
        return
      }
      if (cmd === "recap") {
        setMode("recap")
        return
      }

      // Pas de commande nav → tenter de parser une note
      if (!currentStudent) return
      const result = parseSpokenGrade(transcript)
      if (!result) return

      if ("error" in result && result.error) {
        setFeedback("error")
        toast.warning("Note invalide", { description: result.error })
        return
      }

      if (result.absent) {
        setEntry(currentStudent.student_id, null)
      } else if (result.value !== null) {
        setEntry(currentStudent.student_id, result.value)
      }
      setFeedback("ok")
      beep()
    },
    [currentStudent, currentIdx, totalStudents, goNext, goPrev, setEntry, beep],
  )

  const speech = useSpeechRecognition({
    lang: "fr-FR",
    onResult: handleTranscript,
    onError: (msg) => toast.error("Micro", { description: msg }),
  })

  const toggleMic = useCallback(() => {
    if (speech.listening) {
      speech.stop()
    } else {
      // Initialise l'AudioContext dans le user gesture du clic — iOS l'exige.
      ensureAudio()
      speech.start()
    }
  }, [speech, ensureAudio])

  // ─── Quitter avec garde sur dirty ──────────────────────────────────────
  const hasDirty = useMemo(() => {
    if (!grades) return false
    for (const g of grades) {
      const local = entries.get(g.student_id)
      const server = g.value !== null ? Number(g.value) : (g.status === "entered" ? null : undefined)
      if (local !== server) return true
    }
    return false
  }, [grades, entries])

  const performExit = useCallback(() => {
    speech.stop()
    router.push(`/teacher/grades/${classId}/${evaluationId}`)
  }, [speech, router, classId, evaluationId])

  const requestExit = useCallback(() => {
    if (hasDirty) {
      setExitDialogOpen(true)
    } else {
      performExit()
    }
  }, [hasDirty, performExit])

  // ─── Save batch ────────────────────────────────────────────────────────
  const submitAll = useCallback(() => {
    if (!grades) return
    const payload = Array.from(entries.entries())
      .filter(([studentId]) => grades.some((g) => g.student_id === studentId))
      .map(([studentId, value]) => ({
        student_id: studentId,
        value: value === undefined ? null : value,
      }))
    updateMutation.mutate(
      { grades: payload },
      {
        onSuccess: () => {
          toast.success("Notes enregistrées", {
            description: `${payload.filter((p) => p.value !== null).length} notes sur ${grades.length}`,
          })
          speech.stop()
          router.push(`/teacher/grades/${classId}/${evaluationId}`)
        },
      },
    )
  }, [grades, entries, updateMutation, speech, router, classId, evaluationId])

  // ─── Rendu ─────────────────────────────────────────────────────────────
  if (isLoading || !grades) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (mode === "recap") {
    return (
      <RecapView
        grades={grades}
        entries={entries}
        evaluationTitle={evaluation?.title}
        onModify={(idx) => {
          setCurrentIdx(idx)
          setMode("entering")
        }}
        onSubmit={submitAll}
        onCancel={() => setMode("entering")}
        isSubmitting={updateMutation.isPending}
      />
    )
  }

  if (totalStudents === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-white">
        <p className="text-lg">Aucun élève dans cette classe.</p>
        <Button onClick={requestExit} variant="secondary">
          Retour
        </Button>
      </div>
    )
  }

  if (!currentStudent) return null

  const filledCount = grades.filter((g) => entries.get(g.student_id) !== undefined).length
  const progressPct = (filledCount / totalStudents) * 100

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top bar — exit + progress */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={requestExit}
          className="h-10 w-10 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Quitter le mode dictée"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/60">
            <span>Mode dictée</span>
            <span className="tabular-nums">
              {filledCount} / {totalStudents} saisis
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <Button
          onClick={() => setMode("recap")}
          variant="secondary"
          size="sm"
          className="h-10 bg-white/10 text-white hover:bg-white/20"
        >
          Voir le récap
        </Button>
      </div>

      {/* Center — student + grade */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Élève {currentIdx + 1} sur {totalStudents}
          </p>
          <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {currentStudent.student_name}
          </h1>
          {evaluation && (
            <p className="text-sm text-white/60">
              {evaluation.subject_name} · {evaluation.title}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex flex-col items-center gap-2 rounded-3xl border px-8 py-6 transition-colors",
            feedback === "ok" && "border-emerald-400/40 bg-emerald-400/5",
            feedback === "error" && "border-rose-400/40 bg-rose-400/5",
            !feedback && "border-white/10 bg-white/[0.03]",
          )}
        >
          {currentValue === undefined ? (
            <span className="text-7xl font-bold text-white/20 sm:text-8xl">—</span>
          ) : currentValue === null ? (
            <span className="text-5xl font-bold text-amber-300 sm:text-6xl">ABSENT</span>
          ) : (
            <span className="font-bold tabular-nums text-white text-7xl sm:text-9xl">
              {Number.isInteger(currentValue)
                ? currentValue
                : currentValue.toString().replace(".", ",")}
            </span>
          )}
          <span className="text-sm text-white/50">/ 20</span>
        </div>

        {transcriptDisplay && (
          <p className="max-w-md text-sm italic text-white/60">
            « {transcriptDisplay} »
          </p>
        )}
        {speech.interimTranscript && !transcriptDisplay && (
          <p className="max-w-md text-sm italic text-white/40">
            … {speech.interimTranscript}
          </p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="space-y-3 px-4 pb-6">
        {!speech.supported && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Reconnaissance vocale indisponible sur ce navigateur. Saisissez avec
              les boutons ou utilisez Chrome / Safari récent.
            </span>
          </div>
        )}

        {speech.supported && speech.permissionDenied && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Accès au micro refusé. Autorisez-le dans les paramètres du navigateur
              puis rechargez la page.
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="h-16 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="ml-1 hidden sm:inline">Précédent</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              if (!currentStudent) return
              setEntry(currentStudent.student_id, null)
              setFeedback("ok")
              beep()
            }}
            className="h-16 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
          >
            Absent
          </Button>

          <Button
            size="lg"
            onClick={goNext}
            className="h-16 bg-emerald-500 text-white hover:bg-emerald-600"
          >
            <span className="hidden sm:inline">
              {currentIdx === totalStudents - 1 ? "Récap" : "Suivant"}
            </span>
            {currentIdx === totalStudents - 1 ? (
              <Check className="ml-1 h-6 w-6 sm:ml-2" />
            ) : (
              <ChevronRight className="ml-1 h-6 w-6 sm:ml-2" />
            )}
          </Button>
        </div>

        {speech.supported && !speech.permissionDenied && (
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleMic}
            className={cn(
              "h-14 w-full gap-2 border text-white",
              speech.listening
                ? "border-emerald-400/50 bg-emerald-500/10 hover:bg-emerald-500/20"
                : "border-white/20 bg-white/[0.04] hover:bg-white/10",
            )}
          >
            {speech.listening ? (
              <>
                <Mic className={cn("h-5 w-5", speech.listening && "animate-pulse text-emerald-400")} />
                <span>Micro actif — dites votre note</span>
              </>
            ) : (
              <>
                <MicOff className="h-5 w-5 opacity-60" />
                <span>Activer le micro</span>
              </>
            )}
          </Button>
        )}
      </div>

      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter sans enregistrer ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des notes saisies qui n&apos;ont pas encore été envoyées au
              serveur. Quitter maintenant les perdra définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer la dictée</AlertDialogCancel>
            <AlertDialogAction
              onClick={performExit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Recap view — final review before save
// ─────────────────────────────────────────────────────────────────────────

interface RecapViewProps {
  grades: { student_id: number; student_name: string }[]
  entries: Map<number, EntryValue>
  evaluationTitle?: string
  onModify: (idx: number) => void
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
}

function RecapView({
  grades,
  entries,
  evaluationTitle,
  onModify,
  onSubmit,
  onCancel,
  isSubmitting,
}: RecapViewProps) {
  const filled = grades.filter((g) => entries.get(g.student_id) !== undefined).length
  const absent = grades.filter((g) => entries.get(g.student_id) === null).length
  const missing = grades.length - filled

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-10 w-10 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Retour à la dictée"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-serif text-xl tracking-tight">Récapitulatif</h2>
          {evaluationTitle && (
            <p className="text-xs text-white/60">{evaluationTitle}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <RecapTile label="Saisies" value={filled - absent} tone="ok" />
        <RecapTile label="Absents" value={absent} tone="warn" />
        <RecapTile label="Manquants" value={missing} tone={missing > 0 ? "danger" : "neutral"} />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {grades.map((g, idx) => {
          const v = entries.get(g.student_id)
          const isMissing = v === undefined
          return (
            <button
              type="button"
              key={g.student_id}
              onClick={() => onModify(idx)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                "border-white/10 bg-white/[0.02] hover:bg-white/10",
                isMissing && "border-rose-400/30 bg-rose-400/5",
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs tabular-nums">
                {idx + 1}
              </span>
              <span className="flex-1 truncate text-sm">{g.student_name}</span>
              <span
                className={cn(
                  "tabular-nums text-base font-semibold",
                  v === undefined && "text-rose-300",
                  v === null && "text-amber-300",
                  typeof v === "number" && v < 10 && "text-rose-300",
                  typeof v === "number" && v >= 10 && v < 14 && "text-amber-300",
                  typeof v === "number" && v >= 14 && "text-emerald-300",
                )}
              >
                {v === undefined
                  ? "—"
                  : v === null
                    ? "Absent"
                    : Number.isInteger(v)
                      ? v
                      : v.toString().replace(".", ",")}
              </span>
              <Pencil className="h-4 w-4 text-white/40" />
            </button>
          )
        })}
      </div>

      <div className="space-y-2 border-t border-white/10 px-4 py-4">
        {missing > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {missing} élève{missing > 1 ? "s" : ""} sans note. Vous pourrez les
              compléter plus tard.
            </span>
          </div>
        )}
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting || filled === 0}
          className="h-14 w-full bg-emerald-500 text-white hover:bg-emerald-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Enregistrer {filled} note{filled > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function RecapTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "ok" | "warn" | "danger" | "neutral"
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "ok" && "text-emerald-300",
          tone === "warn" && "text-amber-300",
          tone === "danger" && "text-rose-300",
          tone === "neutral" && "text-white",
        )}
      >
        {value}
      </p>
    </div>
  )
}
