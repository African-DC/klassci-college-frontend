"use client"

import { useEffect, useId, useState } from "react"
import { AlertTriangle, Mail, ScrollText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HoldToConfirmButton } from "@/components/shared/HoldToConfirmButton"
import { ARCHIVE_REASON_MIN_LENGTH } from "@/lib/contracts/archive"
import { cn } from "@/lib/utils"

export type DestructiveTone = "warning" | "danger"

interface DestructiveActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Titre du dialogue, par exemple « Archiver cette fiche ». */
  title: string
  /** Ce que le geste va réellement faire, en une phrase. */
  description: string
  /** Le libellé de la fiche visée, rappelé pour éviter l'erreur de ligne. */
  subject?: string | null
  /** Durée du maintien : 5 s pour archiver, 10 s pour supprimer. */
  seconds: number
  confirmLabel: string
  holdingLabel: string
  /** `warning` pour un geste réversible, `danger` pour l'irréversible. */
  tone?: DestructiveTone
  /** Phrase supplémentaire affichée en encadré, pour l'irréversible. */
  consequence?: string
  isPending?: boolean
  onConfirm: (reason: string) => void
}

/**
 * Demande un motif avant un geste destructeur, puis n'ouvre la confirmation
 * qu'une fois ce motif écrit.
 *
 * Le motif n'est pas une formalité : il part au journal et par courriel à la
 * direction. Le dialogue le dit avant la saisie, pas après, parce qu'une
 * personne qui sait que sa phrase sera lue en écrit une vraie.
 */
export function DestructiveActionDialog({
  open,
  onOpenChange,
  title,
  description,
  subject,
  seconds,
  confirmLabel,
  holdingLabel,
  tone = "danger",
  consequence,
  isPending = false,
  onConfirm,
}: DestructiveActionDialogProps) {
  const [reason, setReason] = useState("")
  const reasonId = useId()
  const hintId = useId()

  // À chaque ouverture on repart d'un motif vide : réutiliser celui de la
  // fiche précédente ferait signer une justification qui ne la concerne pas.
  useEffect(() => {
    if (open) setReason("")
  }, [open])

  const trimmedLength = reason.trim().length
  const isReasonValid = trimmedLength >= ARCHIVE_REASON_MIN_LENGTH
  const missing = ARCHIVE_REASON_MIN_LENGTH - trimmedLength

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        // On ne ferme pas sur un appui à côté : le motif déjà tapé serait
        // perdu, et sur téléphone le doigt sort du cadre très facilement.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
                tone === "danger"
                  ? "bg-gradient-to-br from-rose-600 to-rose-500"
                  : "bg-gradient-to-br from-amber-500 to-amber-400",
              )}
            >
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {subject && (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Fiche concernée
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold">{subject}</p>
            </div>
          )}

          {consequence && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/30">
              <p className="text-sm font-medium text-rose-900 dark:text-rose-100">{consequence}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={reasonId} className="text-sm font-medium">
              Motif <span className="text-muted-foreground">(obligatoire)</span>
            </Label>
            <Textarea
              id={reasonId}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-describedby={hintId}
              aria-invalid={!isReasonValid}
              placeholder="Expliquez en une phrase pourquoi cette décision est prise."
              className="min-h-24 resize-none"
              disabled={isPending}
            />
            <div id={hintId} className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {isReasonValid
                  ? "Motif suffisant."
                  : `Encore ${missing} caractère${missing > 1 ? "s" : ""} au minimum.`}
              </p>
              <p
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  isReasonValid ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400",
                )}
              >
                {trimmedLength} / {ARCHIVE_REASON_MIN_LENGTH}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/40 p-3">
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Votre nom, la date et ce motif seront enregistrés au journal de
              l&apos;établissement.
            </p>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Un courriel sera envoyé à la direction.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 sm:h-10"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>

          {/* Le bouton de confirmation n'existe pas tant que le motif n'est
              pas écrit : un bouton grisé invite à chercher comment l'activer,
              un bouton absent dit clairement qu'il manque quelque chose. */}
          {isReasonValid ? (
            <HoldToConfirmButton
              seconds={seconds}
              label={confirmLabel}
              holdingLabel={holdingLabel}
              variant={tone === "danger" ? "destructive" : "default"}
              disabled={isPending}
              onConfirm={() => onConfirm(reason.trim())}
            />
          ) : (
            <p className="flex h-11 items-center justify-center rounded-md border border-dashed px-4 text-xs text-muted-foreground sm:h-10">
              Saisissez un motif pour débloquer la confirmation
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
