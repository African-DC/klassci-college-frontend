"use client"

import { useEffect, useState } from "react"
import { DoorOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { useIssueEntrySlip } from "@/lib/hooks/useEntrySlip"

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

interface EntrySlipModalProps {
  open: boolean
  onClose: () => void
  /** Enregistrement d'appel à régulariser. */
  recordId: number | null
  studentLabel: string
  /** Date de l'absence, pour rappeler ce qui est régularisé. */
  absenceDate?: string
}

/**
 * Billet d'entrée : le formulaire ferme l'absence dans le cahier d'appel et
 * imprime la réadmission. Deux champs seulement, parce qu'il s'en délivre des
 * dizaines chaque matin au guichet.
 */
export function EntrySlipModal({
  open,
  onClose,
  recordId,
  studentLabel,
  absenceDate,
}: EntrySlipModalProps) {
  const [resumeDate, setResumeDate] = useState(today)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { mutate: issue, isPending } = useIssueEntrySlip()

  useEffect(() => {
    if (open) {
      setResumeDate(today())
      setNotes("")
      setError(null)
    }
  }, [open])

  function handleSubmit() {
    if (recordId === null) return
    if (!resumeDate) {
      setError("Indiquez la date de reprise des cours.")
      return
    }
    if (absenceDate && resumeDate < absenceDate) {
      setError("La reprise ne peut pas précéder l'absence qu'elle régularise.")
      return
    }
    setError(null)
    issue(
      { recordId, payload: { resume_date: resumeDate, notes }, studentLabel },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            Billet d&apos;entrée
          </DialogTitle>
          <DialogDescription>
            {studentLabel}
            {absenceDate ? ` · absence du ${absenceDate}` : ""}. Le billet régularise cette
            absence dans le cahier d&apos;appel, puis le PDF se télécharge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="entry-slip-resume">Reprise des cours</Label>
            <Input
              id="entry-slip-resume"
              type="date"
              value={resumeDate}
              onChange={(event) => setResumeDate(event.target.value)}
              className="h-11 sm:h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="entry-slip-notes">Motif (facultatif)</Label>
            <Textarea
              id="entry-slip-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Maladie justifiée par certificat, deuil familial…"
              maxLength={500}
              className="min-h-20"
            />
            <p className="text-xs text-muted-foreground">
              Le motif est repris dans le cahier d&apos;appel, à côté de l&apos;absence excusée.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
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
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
            )}
            {isPending ? "Délivrance…" : "Délivrer le billet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
