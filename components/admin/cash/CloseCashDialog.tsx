"use client"

import { useState } from "react"
import { AlertTriangle, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCloseMyCashSession } from "@/lib/hooks/useCashSessions"
import { formatFcfa } from "./cash-ui"

interface CloseCashDialogProps {
  open: boolean
  onClose: () => void
  /** Espèces théoriques du jour : ce que le tiroir devrait contenir. */
  expectedCash: number
  businessDate?: string
}

/**
 * Clôture de journée. Le caissier compte son tiroir et saisit ce qu'il y
 * trouve — on ne pré-remplit surtout pas avec le théorique, sinon il
 * validerait sans compter et l'écart ne voudrait plus rien dire.
 */
export function CloseCashDialog({
  open,
  onClose,
  expectedCash,
  businessDate,
}: CloseCashDialogProps) {
  const [counted, setCounted] = useState("")
  const [notes, setNotes] = useState("")
  const { mutate, isPending } = useCloseMyCashSession(businessDate)

  const countedValue = counted.trim() === "" ? null : Number(counted)
  const isValid = countedValue !== null && Number.isFinite(countedValue) && countedValue >= 0
  const variance = isValid ? countedValue - expectedCash : null

  function handleClose() {
    if (!isValid) return
    mutate(
      { counted_amount: countedValue, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          setCounted("")
          setNotes("")
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Clôturer ma journée</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Espèces attendues dans le tiroir
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatFcfa(expectedCash)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les paiements Wave, Orange Money, chèque et virement ne passent pas par le tiroir.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counted-amount">Espèces comptées *</Label>
            <Input
              id="counted-amount"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="h-11 text-lg tabular-nums"
              placeholder="Comptez le tiroir puis saisissez le total"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              disabled={isPending}
            />
          </div>

          {variance !== null && variance !== 0 && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  {variance < 0 ? "Manquant" : "Excédent"} de {formatFcfa(Math.abs(variance))}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Expliquez l&apos;écart dans la note ci-dessous. La clôture reste possible.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cash-notes">Note {variance ? "(recommandée)" : "(facultative)"}</Label>
            <Textarea
              id="cash-notes"
              placeholder="Remise à la direction, incident, explication d'un écart..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Une fois clôturée, la journée est verrouillée : vous ne pourrez plus encaisser ni
            annuler dessus. Toute correction passera par la comptabilité.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button className="h-11 gap-2" onClick={handleClose} disabled={!isValid || isPending}>
            <Lock aria-hidden="true" className="h-4 w-4" />
            {isPending ? "Clôture..." : "Clôturer la journée"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
