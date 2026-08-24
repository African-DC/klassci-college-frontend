"use client"

import { useState } from "react"
import { Loader2, ShieldAlert } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { formatFcfa } from "@/lib/utils/money"

const MIN_REASON_LENGTH = 10

interface DocumentOverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentLabel: string
  lateAmount: number
  pending?: boolean
  onConfirm: (reason: string) => void
}

/**
 * Demande le motif avant de délivrer un document malgré la dette.
 *
 * Le motif est obligatoire : sans lui, le journal dirait qu'on a passé outre
 * sans dire pourquoi, ce qui ne vaut guère mieux que pas de trace du tout. Le
 * texte prévient explicitement que la dérogation est enregistrée — personne ne
 * doit découvrir après coup que son nom y figure.
 */
export function DocumentOverrideDialog({
  open,
  onOpenChange,
  documentLabel,
  lateAmount,
  pending = false,
  onConfirm,
}: DocumentOverrideDialogProps) {
  const [reason, setReason] = useState("")
  const trimmed = reason.trim()
  const tooShort = trimmed.length < MIN_REASON_LENGTH

  function handleOpenChange(next: boolean) {
    if (!next) setReason("")
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert aria-hidden="true" className="h-5 w-5 text-accent" />
            Délivrer malgré la dette
          </DialogTitle>
          <DialogDescription>
            {documentLabel} sera délivré alors que {formatFcfa(lateAmount)}{" "}
            d&apos;échéances arrivées à terme restent impayées.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="override-reason">Motif de la dérogation *</Label>
          <Textarea
            id="override-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Exemple : cas social validé en conseil de direction du 12 janvier."
            rows={3}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Votre nom, la date et ce motif sont enregistrés dans le journal de
            l&apos;établissement.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="h-11 sm:h-10"
            onClick={() => handleOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            className="h-11 bg-accent text-accent-foreground hover:bg-accent/90 sm:h-10"
            disabled={tooShort || pending}
            onClick={() => onConfirm(trimmed)}
          >
            {pending ? (
              <>
                <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              "Délivrer et journaliser"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
