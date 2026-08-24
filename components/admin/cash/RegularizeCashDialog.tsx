"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ClipboardCheck } from "lucide-react"
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
import { useRegularizeCashSession } from "@/lib/hooks/useCashSessions"
import type { CashSession } from "@/lib/contracts/cash-session"
import { formatFcfa, formatBusinessDate } from "./cash-ui"

interface RegularizeCashDialogProps {
  /** La journée à régulariser, ou `null` quand la boîte est fermée. */
  session: CashSession | null
  onClose: () => void
}

/**
 * Régularisation d'une journée clôturée d'office.
 *
 * Le théorique affiché est celui qui a été FIGÉ la nuit de la clôture, pas un
 * théorique recalculé : c'est contre lui que se mesurera l'écart, et le
 * caissier doit voir le même chiffre que celui qui servira au calcul.
 *
 * Le champ « compté » n'est jamais pré-rempli avec le théorique, sinon le
 * caissier validerait sans compter et l'écart ne voudrait plus rien dire.
 */
export function RegularizeCashDialog({ session, onClose }: RegularizeCashDialogProps) {
  const [counted, setCounted] = useState("")
  const [notes, setNotes] = useState("")
  const businessDate = session?.business_date ?? ""
  const { mutate, isPending } = useRegularizeCashSession(businessDate)

  // Passer d'une journée à l'autre sans vider les champs ferait saisir le
  // comptage du lundi sur la journée du mardi.
  useEffect(() => {
    setCounted("")
    setNotes("")
  }, [businessDate])

  const expectedCash = session?.expected_amount ?? 0
  const countedValue = counted.trim() === "" ? null : Number(counted)
  const isValid = countedValue !== null && Number.isFinite(countedValue) && countedValue >= 0
  const variance = isValid ? countedValue - expectedCash : null

  function handleSubmit() {
    if (!isValid || !session) return
    mutate(
      { counted_amount: countedValue, notes: notes.trim() || undefined },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <Dialog open={session !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            Régulariser la journée du {session ? formatBusinessDate(session.business_date) : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cette journée a été clôturée d&apos;office à minuit, sans comptage. Saisissez ce que
            vous aviez compté dans le tiroir ce jour-là : l&apos;écart sera calculé sur le
            théorique arrêté à ce moment.
          </p>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Espèces attendues ce jour-là
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatFcfa(expectedCash)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Montant arrêté à la clôture d&apos;office. Il ne bouge plus.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="regularize-counted">Espèces comptées *</Label>
            <Input
              id="regularize-counted"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="h-11 text-lg tabular-nums"
              placeholder="Ce que vous aviez compté ce jour-là"
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
                  Expliquez l&apos;écart dans la note ci-dessous. La régularisation reste possible.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="regularize-notes">
              Note {variance ? "(recommandée)" : "(facultative)"}
            </Label>
            <Textarea
              id="regularize-notes"
              placeholder="Pourquoi la journée n'a pas été clôturée, explication d'un écart..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            La régularisation est tracée : elle indique qui a saisi le comptage et quand.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button className="h-11 gap-2" onClick={handleSubmit} disabled={!isValid || isPending}>
            <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
            {isPending ? "Enregistrement..." : "Enregistrer le comptage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
