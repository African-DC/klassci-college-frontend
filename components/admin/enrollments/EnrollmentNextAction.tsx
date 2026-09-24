"use client"

import { Check, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { prochaineEtape } from "@/lib/enrollment/selection"
import type { Enrollment } from "@/lib/contracts/enrollment"

interface EnrollmentNextActionProps {
  enrollment: Enrollment
  /** Droit d'encaisser (`payments:create`), lu par l'appelant. */
  peutEncaisser: boolean
  /** Droit de valider (`enrollments:validate`), lu par l'appelant. */
  peutValider: boolean
  onEncaisser: (enrollment: Enrollment) => void
  onValider: (enrollment: Enrollment) => void
  /** `wide` : pleine largeur et cible tactile h-11, pour la liste sur téléphone. */
  wide?: boolean
}

/**
 * Le geste suivant d'une inscription, et seulement celui que la personne peut
 * faire.
 *
 * Encaisser d'abord, valider ensuite : c'est l'ordre que le serveur impose.
 * Qui ne peut pas encaisser voit que le dossier attend la caisse, plutôt
 * qu'un bouton qui échouerait.
 */
export function EnrollmentNextAction({
  enrollment,
  peutEncaisser,
  peutValider,
  onEncaisser,
  onValider,
  wide,
}: EnrollmentNextActionProps) {
  const etape = prochaineEtape(enrollment)
  const taille = wide ? "h-11 w-full" : "h-9"

  if (etape === "encaisser") {
    if (!peutEncaisser) {
      return (
        <span className={cn("text-xs text-muted-foreground", wide && "block text-center")}>
          Attend un versement à la caisse
        </span>
      )
    }
    return (
      <Button
        type="button"
        size={wide ? "default" : "sm"}
        className={taille}
        onClick={(ev) => {
          ev.stopPropagation()
          onEncaisser(enrollment)
        }}
      >
        <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
        Encaisser
      </Button>
    )
  }

  if (etape === "valider" && peutValider) {
    return (
      <Button
        type="button"
        size={wide ? "default" : "sm"}
        className={cn(taille, "bg-emerald-600 text-white hover:bg-emerald-700")}
        onClick={(ev) => {
          ev.stopPropagation()
          onValider(enrollment)
        }}
      >
        <Check className="mr-1.5 h-4 w-4" aria-hidden />
        {wide ? "Valider l'inscription" : "Valider"}
      </Button>
    )
  }

  return null
}
