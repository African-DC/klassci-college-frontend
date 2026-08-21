"use client"

import { useEffect, useState } from "react"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRecordSummonsOutcome } from "@/lib/hooks/useSummons"
import { SUMMONS_OUTCOME_OPTIONS } from "@/lib/contracts/school-life"
import type { ParentSummons, SummonsOutcome } from "@/lib/contracts/school-life"

/** Consigne au registre si le tuteur s'est présenté, et ce qui s'est dit. */
export function SummonsOutcomeModal({
  summons,
  onClose,
}: {
  summons: ParentSummons | null
  onClose: () => void
}) {
  const [outcome, setOutcome] = useState<SummonsOutcome>("attended")
  const [notes, setNotes] = useState("")
  const { mutate: record, isPending } = useRecordSummonsOutcome()

  useEffect(() => {
    if (summons) {
      setOutcome(summons.outcome === "pending" ? "attended" : summons.outcome)
      setNotes(summons.outcome_notes ?? "")
    }
  }, [summons])

  function handleSubmit() {
    if (!summons) return
    record({ id: summons.id, data: { outcome, notes } }, { onSuccess: () => onClose() })
  }

  return (
    <Dialog open={summons !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            Suite donnée
          </DialogTitle>
          <DialogDescription>
            {summons
              ? `${summons.student_name} · tuteur ${summons.parent_name ?? "non nommé"}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="summons-outcome">Le tuteur s&apos;est-il présenté ?</Label>
            <Select value={outcome} onValueChange={(value) => setOutcome(value as SummonsOutcome)}>
              <SelectTrigger id="summons-outcome" className="h-11 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUMMONS_OUTCOME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summons-outcome-notes">Compte rendu (facultatif)</Label>
            <Textarea
              id="summons-outcome-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Engagements pris, décisions, personne rencontrée…"
              maxLength={2000}
              className="min-h-24"
            />
            <p className="text-xs text-muted-foreground">
              Le compte rendu reste au registre : c&apos;est lui que le conseil de classe relit.
            </p>
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
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            )}
            {isPending ? "Enregistrement…" : "Consigner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
