"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { peutRecevoirDeLArgent } from "@/lib/contracts/payment"
import type { EnrollmentFeeItem } from "@/components/admin/payments/EnrollmentFeesBreakdown"

/** Le serveur exige la même longueur : une phrase, pas un mot. */
const MOTIF_MINIMUM = 10

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`

/** L'imputation qu'on s'apprête à déplacer, et d'où elle vient. */
export interface ReallocationTarget {
  paymentId: number
  fromFeeId: number
  fromFeeName: string
  /** Ce que ce versement-là a posé sur ce frais : le premier des deux plafonds. */
  allocated: number
}

/**
 * Déplacer une imputation vers le bon frais, sans annuler le versement.
 *
 * Les deux plafonds sont annoncés **avant** la saisie, pas après le refus :
 * ce que ce versement a réellement posé sur le frais de départ, et le reste dû
 * du frais d'arrivée. Le serveur reste seul juge — il voit les autres
 * versements, et le reste dû a pu bouger pendant que la boîte était ouverte —
 * mais faire découvrir un plafond par un message d'erreur, c'est faire saisir
 * deux fois.
 *
 * Les frais qui n'attendent plus d'argent ne sont pas proposés : soldés,
 * exonérés, déposés en nature. Le serveur les refuserait, et un choix qui ne
 * peut pas aboutir n'est pas un choix.
 */
export function ReallocateAllocationDialog({
  target,
  fees,
  onClose,
  onConfirm,
  busy,
}: {
  target: ReallocationTarget | null
  /** Tous les frais du dossier : c'est la liste qui dit lequel peut recevoir. */
  fees: EnrollmentFeeItem[]
  onClose: () => void
  onConfirm: (input: { toFeeId: number; amount: number; reason: string }) => void
  busy: boolean
}) {
  const [versFrais, setVersFrais] = useState<string>("")
  const [montant, setMontant] = useState<string>("")
  const [motif, setMotif] = useState<string>("")

  // Une saisie abandonnée ne doit pas réapparaître sur l'imputation suivante :
  // ce serait signer le déplacement d'une autre avec la phrase d'avant.
  useEffect(() => {
    if (!target) {
      setVersFrais("")
      setMontant("")
      setMotif("")
    }
  }, [target])

  const destinations = useMemo(
    () =>
      fees
        .filter((f) => f.id !== target?.fromFeeId)
        .filter((f) => peutRecevoirDeLArgent(f.status, f.remaining))
        .map((f) => ({
          id: f.id,
          name: f.option_name ?? f.category_name,
          remaining: f.remaining,
        })),
    [fees, target?.fromFeeId],
  )

  const destination = destinations.find((d) => String(d.id) === versFrais)
  const plafond = Math.min(target?.allocated ?? 0, destination?.remaining ?? 0)
  const valeur = Number(montant)
  const montantValide = Number.isFinite(valeur) && valeur > 0 && valeur <= plafond
  const motifTropCourt = motif.trim().length < MOTIF_MINIMUM
  const pretAEnvoyer = !!destination && montantValide && !motifTropCourt

  return (
    <AlertDialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Déplacer cette imputation ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le versement ne change pas : ni son montant, ni sa date, ni la caisse. Seule
            change la ligne de frais sur laquelle cet argent est compté.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium">
              {target?.fromFeeName}
            </span>
            <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {destination?.name ?? "à choisir"}
            </span>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reimputation-frais" className="text-sm font-medium">
              Vers quel frais *
            </label>
            {destinations.length === 0 ? (
              <p className="rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-200">
                Aucun autre frais de ce dossier n&apos;attend d&apos;argent : tout est soldé,
                exonéré ou déposé. Il n&apos;y a nulle part où déplacer cette imputation.
              </p>
            ) : (
              <Select value={versFrais} onValueChange={setVersFrais}>
                <SelectTrigger id="reimputation-frais" className="h-11 sm:h-10">
                  <SelectValue placeholder="Choisir le frais qui doit recevoir" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name} — reste {fmt(d.remaining)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reimputation-montant" className="text-sm font-medium">
              Combien *
            </label>
            <Input
              id="reimputation-montant"
              type="number"
              inputMode="numeric"
              min={1}
              max={plafond || undefined}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              disabled={!destination}
              className="h-11 sm:h-10"
              placeholder={destination ? String(plafond) : "Choisissez d'abord le frais"}
            />
            {/* Helper text visible, pas seulement un champ grisé : sur un écran
                d'entrée de gamme en plein soleil, le grisé ne se voit pas. */}
            <p className="text-xs text-muted-foreground">
              {destination
                ? `Au plus ${fmt(plafond)} : ${fmt(target?.allocated ?? 0)} posés ici, et ${fmt(destination.remaining)} encore dus là-bas.`
                : "Choisissez d'abord le frais qui doit recevoir."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reimputation-motif" className="text-sm font-medium">
              Pourquoi *
            </label>
            <Textarea
              id="reimputation-motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : le paquet de rames a été apporté, ces 3 000 F règlent la scolarité."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Une phrase, pas un mot : elle reste dans le journal avec votre nom.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Retour</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || !pretAEnvoyer}
            onClick={() => {
              if (!destination) return
              onConfirm({ toFeeId: destination.id, amount: valeur, reason: motif.trim() })
            }}
          >
            {busy ? "Déplacement..." : "Déplacer ce montant"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
