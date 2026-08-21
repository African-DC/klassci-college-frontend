"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { useGrades, useUpdateGrades, useEvaluations } from "@/lib/hooks/useGrades"
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition"
import { parseSpokenGrade, detectCommand } from "@/lib/utils/voice-grade-parser"
import { dicteeEntryFromServer } from "@/lib/utils/grade-reconciliation"
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
import { DicteeStudentStage } from "./dictee/DicteeStudentStage"
import { DicteeRoster } from "./dictee/DicteeRoster"
import { DicteeControls } from "./dictee/DicteeControls"
import { RecapView } from "./dictee/RecapView"
import type { EntryValue } from "./dictee/types"

interface DicteeModeProps {
  evaluationId: number
  classId: number
  /**
   * Page vers laquelle revenir à la sortie/l'enregistrement. Par défaut la
   * saisie enseignant. L'admin (saisie déléguée) passe sa propre page de
   * supervision : sans ça, revenir vers `/teacher/...` ferait traverser les
   * portails et le middleware redirigerait l'admin vers son tableau de bord.
   */
  returnHref?: string
}

/**
 * Mode Dictée — saisie vocale, optimisée Mme Diallo (52, Itel S661, plein
 * soleil). Mobile = plein écran séquentiel dark ; desktop = même flux + panneau
 * roster de classe à droite (`lg:`) pour remplir l'espace et naviguer d'un clic.
 *
 * Flow : activer micro → « douze virgule cinq » → « suivant » → … → récap →
 * enregistrer (batch BE). Tout reste utilisable au tap sans micro (fallback).
 */
export function DicteeMode({ evaluationId, classId, returnHref }: DicteeModeProps) {
  const router = useRouter()
  const backHref = returnHref ?? `/teacher/grades/${classId}/${evaluationId}`
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
        const initial = dicteeEntryFromServer(g)
        if (initial !== undefined) map.set(g.student_id, initial)
      })
      setEntries(map)
    }
  }, [grades])

  // ─── Beep audio (succès) ───────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null)
  const ensureAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
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
      if (ctx.state === "suspended") void ctx.resume()
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

  const setEntry = useCallback((studentId: number, value: EntryValue) => {
    setEntries((prev) => {
      const next = new Map(prev)
      next.set(studentId, value)
      return next
    })
  }, [])

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

  const jumpTo = useCallback((idx: number) => {
    setCurrentIdx(idx)
    setTranscriptDisplay("")
    setFeedback(null)
  }, [])

  // ─── Voice handler ─────────────────────────────────────────────────────
  const handleTranscript = useCallback(
    (transcript: string) => {
      setTranscriptDisplay(transcript)
      const cmd = detectCommand(transcript)
      if (cmd === "next") return goNext()
      if (cmd === "prev") return goPrev()
      if (cmd === "exit" || cmd === "recap") {
        setMode("recap")
        return
      }

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
    [currentStudent, goNext, goPrev, setEntry, beep],
  )

  const speech = useSpeechRecognition({
    lang: "fr-FR",
    onResult: handleTranscript,
    onError: (msg) => toast.error("Micro", { description: msg }),
  })

  const onMicToggle = useCallback(() => {
    if (speech.listening) {
      speech.stop()
    } else {
      // Init AudioContext dans le geste utilisateur (iOS l'exige). `start()`
      // déclenche lui-même le prompt de permission micro (Chrome).
      ensureAudio()
      speech.start()
    }
  }, [speech, ensureAudio])

  const onMicRetry = useCallback(() => {
    speech.reset()
    ensureAudio()
    speech.start()
  }, [speech, ensureAudio])

  // Après un refus micro corrigé via les réglages du site, Chromium exige un
  // rechargement pour l'appliquer. En état « refusé » rien n'est saisi (0/N) →
  // reload sans risque de perte.
  const onMicReload = useCallback(() => {
    window.location.reload()
  }, [])

  // ─── Quitter avec garde sur dirty ──────────────────────────────────────
  // La référence est exactement ce que l'amorçage a mis dans `entries` : un
  // absent vaut `null` à l'écran alors que le serveur renvoie le zéro d'office.
  // Comparer à la valeur brute rendait le garde vrai en permanence dès qu'un
  // seul élève était absent, et un garde qui crie à vide ne protège plus rien.
  const hasDirty = useMemo(() => {
    if (!grades) return false
    return grades.some((g) => entries.get(g.student_id) !== dicteeEntryFromServer(g))
  }, [grades, entries])

  const performExit = useCallback(() => {
    speech.stop()
    router.push(backHref as Route)
  }, [speech, router, backHref])

  const requestExit = useCallback(() => {
    if (hasDirty) setExitDialogOpen(true)
    else performExit()
  }, [hasDirty, performExit])

  // ─── Save batch ────────────────────────────────────────────────────────
  const submitAll = useCallback(() => {
    if (!grades) return
    const payload = Array.from(entries.entries())
      .filter(([studentId]) => grades.some((g) => g.student_id === studentId))
      .map(([studentId, value]) => ({
        student_id: studentId,
        value: value === undefined ? null : value,
        // « Absent » dicté à voix haute vaut le même zéro d'office que la case
        // cochée sur la feuille de saisie : les deux modes doivent enregistrer
        // la même chose, sinon le rattrapage n'aura rien à rouvrir.
        absent: value === null,
      }))
    updateMutation.mutate(
      { grades: payload },
      {
        onSuccess: () => {
          toast.success("Notes enregistrées", {
            description: `${payload.filter((p) => p.value !== null).length} notes sur ${grades.length}`,
          })
          speech.stop()
          router.push(backHref as Route)
        },
      },
    )
  }, [grades, entries, updateMutation, speech, router, backHref])

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
          jumpTo(idx)
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
  const currentValue = entries.get(currentStudent.student_id)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top bar — exit + progress + recap */}
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
              className="h-full rounded-full bg-accent transition-all"
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

      {/* Body : colonne principale (scène + contrôles) + roster desktop */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col">
          <DicteeStudentStage
            studentName={currentStudent.student_name}
            position={currentIdx + 1}
            total={totalStudents}
            value={currentValue}
            subjectLabel={
              evaluation ? `${evaluation.subject_name} · ${evaluation.title}` : undefined
            }
            feedback={feedback}
            transcript={transcriptDisplay}
            interim={speech.interimTranscript}
          />
          <div className="mx-auto w-full max-w-2xl lg:max-w-3xl">
            <DicteeControls
              isFirst={currentIdx === 0}
              isLast={currentIdx === totalStudents - 1}
              onPrev={goPrev}
              onAbsent={() => {
                setEntry(currentStudent.student_id, null)
                setFeedback("ok")
                beep()
              }}
              onNext={goNext}
              micSupported={speech.supported}
              micSecureContext={speech.secureContext}
              micListening={speech.listening}
              micPermissionDenied={speech.permissionDenied}
              micServiceUnavailable={speech.serviceUnavailable}
              onMicToggle={onMicToggle}
              onMicRetry={onMicRetry}
              onMicReload={onMicReload}
            />
          </div>
        </div>

        <DicteeRoster
          className="hidden lg:flex"
          students={grades}
          entries={entries}
          currentIdx={currentIdx}
          filledCount={filledCount}
          onJump={jumpTo}
        />
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
