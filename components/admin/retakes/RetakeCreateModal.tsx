"use client"

import { useEffect, useState } from "react"
import { CalendarRange, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { StudentPicker } from "@/components/shared/StudentPicker"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useCreateRetakeAuthorization, useMissedEvaluations } from "@/lib/hooks/useRetakes"
import { RetakeAuthorizationCreateSchema } from "@/lib/contracts/school-life"
import { formatSchoolDate } from "@/components/shared/school-life/school-life-ui"
import type { Student } from "@/lib/contracts/student"

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

/**
 * Billet d'annulation de zéro. Les évaluations proposées sont uniquement
 * celles que l'élève a manquées sur la période : le backend refuse de rouvrir
 * une épreuve qu'il a passée, autant ne pas la lui proposer.
 */
export function RetakeCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState(today)
  const [reason, setReason] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutate: create, isPending } = useCreateRetakeAuthorization()

  const enrolled = Boolean(student?.current_enrollment)

  // Un champ date se saisit caractère par caractère : sans ce délai, chaque
  // frappe relançait la recherche des évaluations manquées.
  const searchedStart = useDebounce(periodStart, 400)
  const searchedEnd = useDebounce(periodEnd, 400)

  const {
    data: evaluations,
    isLoading: loadingEvaluations,
    isError: evaluationsFailed,
    error: evaluationsError,
  } = useMissedEvaluations({
    studentId: student?.id,
    periodStart: searchedStart || undefined,
    periodEnd: searchedEnd || undefined,
  })

  useEffect(() => {
    if (open) {
      setStudent(null)
      setPeriodStart("")
      setPeriodEnd(today())
      setReason("")
      setSelected([])
      setErrors({})
    }
  }, [open])

  // Un changement d'élève ou de période change la liste : garder des cases
  // cochées qui ne s'affichent plus enverrait des évaluations invisibles.
  useEffect(() => {
    setSelected([])
  }, [student, searchedStart, searchedEnd])

  function toggle(evaluationId: number) {
    setSelected((prev) =>
      prev.includes(evaluationId)
        ? prev.filter((id) => id !== evaluationId)
        : [...prev, evaluationId],
    )
  }

  function handleSubmit() {
    const parsed = RetakeAuthorizationCreateSchema.safeParse({
      student_id: student?.id ?? 0,
      period_start: periodStart,
      period_end: periodEnd,
      reason,
      evaluation_ids: selected,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    create(parsed.data, { onSuccess: () => onClose() })
  }

  const periodChosen = Boolean(student && searchedStart && searchedEnd)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" aria-hidden="true" />
            Nouvelle autorisation de reprise
          </DialogTitle>
          <DialogDescription>
            Le billet lève le zéro d&apos;office des évaluations manquées. La note de rattrapage
            reste saisie par l&apos;enseignant, sur sa feuille habituelle.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2 pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="retake-student">Élève</Label>
            <StudentPicker
              inputId="retake-student"
              selected={student}
              onSelect={setStudent}
              onClear={() => setStudent(null)}
            />
            {errors.student_id && <p className="text-sm text-destructive">{errors.student_id}</p>}
            {student && !enrolled && (
              <p className="text-sm text-destructive">
                Cet élève n&apos;a pas d&apos;inscription pour l&apos;année courante : aucune
                évaluation ne peut être rouverte.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="retake-start">Début de l&apos;absence</Label>
              <Input
                id="retake-start"
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
                className="h-11 sm:h-10"
              />
              {errors.period_start && (
                <p className="text-sm text-destructive">{errors.period_start}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="retake-end">Fin de l&apos;absence</Label>
              <Input
                id="retake-end"
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
                className="h-11 sm:h-10"
              />
              {errors.period_end && (
                <p className="text-sm text-destructive">{errors.period_end}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Évaluations manquées sur la période</Label>
            {!periodChosen ? (
              <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                Choisissez l&apos;élève et la période : les évaluations qu&apos;il a manquées
                s&apos;affichent ici.
              </p>
            ) : loadingEvaluations ? (
              <div className="space-y-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            ) : evaluationsFailed ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
                Les évaluations manquées n&apos;ont pas pu être lues.{" "}
                {(evaluationsError as Error | null)?.message ??
                  "Réessayez, et prévenez l'administration si cela persiste."}
              </p>
            ) : (evaluations ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                Aucune évaluation marquée « absent » pour cet élève sur cette période.
                L&apos;enseignant doit d&apos;abord cocher « absent » sur sa feuille de notes.
              </p>
            ) : (
              <div className="space-y-2">
                {(evaluations ?? []).map((evaluation) => (
                  <label
                    key={evaluation.evaluation_id}
                    htmlFor={`retake-eval-${evaluation.evaluation_id}`}
                    className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      id={`retake-eval-${evaluation.evaluation_id}`}
                      checked={selected.includes(evaluation.evaluation_id)}
                      onCheckedChange={() => toggle(evaluation.evaluation_id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {evaluation.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {evaluation.subject_name ?? "Matière non renseignée"} ·{" "}
                        {formatSchoolDate(evaluation.date)} ·
                        coefficient {evaluation.coefficient} · T{evaluation.trimester}
                      </span>
                    </span>
                  </label>
                ))}
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                  Un billet ne couvre qu&apos;un seul trimestre.
                </p>
              </div>
            )}
            {errors.evaluation_ids && (
              <p className="text-sm text-destructive">{errors.evaluation_ids}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="retake-reason">Motif de l&apos;absence</Label>
            <Textarea
              id="retake-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Hospitalisation justifiée, deuil familial…"
              maxLength={2000}
              className="min-h-20"
            />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-11 sm:h-10"
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="h-11 gap-2 sm:h-10">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            )}
            {isPending ? "Délivrance…" : "Délivrer le billet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
