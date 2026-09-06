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
import type { EnrollmentBlockedDetail } from "@/lib/contracts/enrollment"
import { formatFcfa } from "@/lib/utils/money"

/** Un motif d'un mot ne dit rien au collègue qui relira le journal dans six mois. */
const MOTIF_MINIMUM = 10

interface EnrollmentArrearsRefusalProps {
  blocked: EnrollmentBlockedDetail
  pending?: boolean
  /** Renvoie l'inscription avec le motif. Le serveur refuse sans. */
  onOverride?: (reason: string) => void
}

/**
 * Le refus d'inscrire tant qu'un exercice précédent n'est pas soldé.
 *
 * La phrase affichée est celle du serveur, telle quelle : lui seul sait si le
 * lecteur a le droit de voir le chiffre, et la recomposer ici reviendrait à
 * publier un montant qu'il avait décidé de taire.
 *
 * La dérogation n'est proposée que si `can_override` est vrai. Ce booléen vient
 * de la permission `enrollments:arrears:override`, résolue côté serveur : le
 * portail ne refait pas ce raisonnement, sans quoi le bouton apparaîtrait à qui
 * n'a pas le droit et le refus tomberait après la saisie du motif.
 *
 * Le motif est obligatoire. Sans lui, le serveur refuse de nouveau : une
 * dérogation dont le journal ne dit pas pourquoi ne vaut guère mieux que pas de
 * trace du tout.
 */
export function EnrollmentArrearsRefusal({
  blocked,
  pending = false,
  onOverride,
}: EnrollmentArrearsRefusalProps) {
  const [ouvert, setOuvert] = useState(false)
  const [motif, setMotif] = useState("")

  const propre = motif.trim()
  const tropCourt = propre.length < MOTIF_MINIMUM
  const peutDeroger = blocked.can_override && !!onOverride

  function changerOuverture(next: boolean) {
    if (!next) setMotif("")
    setOuvert(next)
  }

  return (
    <div
      role="alert"
      className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/30"
    >
      <div className="flex items-start gap-2">
        <ShieldAlert
          aria-hidden
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">{blocked.message}</p>
          <p className="text-sm text-muted-foreground">
            Reste dû sur les années précédentes :{" "}
            <span className="font-semibold text-foreground">
              {blocked.arrears_amount === null ? "—" : formatFcfa(blocked.arrears_amount)}
            </span>
            {blocked.arrears_amount === null ? " (le montant ne vous est pas communiqué)." : "."}
          </p>
        </div>
      </div>

      {peutDeroger ? (
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={pending}
            onClick={() => changerOuverture(true)}
            className="h-11 bg-accent text-accent-foreground hover:bg-accent/90 sm:h-10"
          >
            Inscrire malgré la dette
          </Button>
        </div>
      ) : null}

      <Dialog open={ouvert} onOpenChange={changerOuverture}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert aria-hidden className="h-5 w-5 text-accent" />
              Inscrire malgré la dette
            </DialogTitle>
            <DialogDescription>
              L&apos;inscription sera enregistrée alors qu&apos;un exercice précédent n&apos;est pas
              soldé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="arrears-override-reason">Motif de la dérogation *</Label>
            <Textarea
              id="arrears-override-reason"
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
              placeholder="Exemple : échéancier signé avec la famille le 12 septembre."
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
              type="button"
              variant="outline"
              className="h-11 sm:h-10"
              onClick={() => changerOuverture(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="h-11 bg-accent text-accent-foreground hover:bg-accent/90 sm:h-10"
              disabled={tropCourt || pending}
              onClick={() => {
                setOuvert(false)
                onOverride?.(propre)
              }}
            >
              {pending ? (
                <>
                  <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Inscrire et journaliser"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
