"use client"

import { Badge } from "@/components/ui/badge"
import { enrollmentProfileBadge, type FeeVariant } from "@/lib/contracts/fee"
import { cn } from "@/lib/utils"

interface FeeVariantAudienceBadgesProps {
  variant: Pick<FeeVariant, "series_id" | "assignment_scope" | "enrollment_profile">
  className?: string
}

/**
 * À qui un montant est facturé, dit en toutes lettres à côté de lui.
 *
 * Sans ces repères, deux lignes de la même catégorie sur le même niveau
 * passent pour un doublon à corriger alors qu'elles visent des élèves
 * différents. Le mot porte l'information, la couleur ne fait que la répéter :
 * l'écran est lu en plein soleil sur une dalle TFT, et l'orange y ressemble
 * au vert.
 */
export function FeeVariantAudienceBadges({ variant, className }: FeeVariantAudienceBadgesProps) {
  const profil = enrollmentProfileBadge(variant.enrollment_profile)
  if (!variant.series_id && !variant.assignment_scope && !profil) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {variant.series_id ? (
        <Badge variant="outline" className="h-5 text-[10px]">
          série
        </Badge>
      ) : null}
      {variant.assignment_scope ? (
        <Badge
          variant="outline"
          className={
            variant.assignment_scope === "affecte"
              ? "h-5 border-emerald-300 text-[10px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
              : "h-5 border-amber-300 text-[10px] text-amber-700 dark:border-amber-800 dark:text-amber-300"
          }
        >
          {variant.assignment_scope === "affecte" ? "affecté" : "non affecté"}
        </Badge>
      ) : null}
      {profil ? (
        // Neutre à dessein : l'affectation et le profil sont deux dimensions
        // indépendantes, les teindre pareil laisserait croire qu'elles se
        // répondent.
        <Badge variant="secondary" className="h-5 text-[10px] font-medium">
          {profil}
        </Badge>
      ) : null}
    </div>
  )
}
