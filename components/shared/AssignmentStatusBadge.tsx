import { Badge } from "@/components/ui/badge"
import { assignmentStatusLabel } from "@/lib/contracts/enrollment"
import { cn } from "@/lib/utils"

interface AssignmentStatusBadgeProps {
  status: string | null | undefined
  className?: string
}

/**
 * Repère visuel du statut d'affectation.
 *
 * L'affectation décide de qui paie : un affecté est subventionné par l'État,
 * un non affecté a toute sa scolarité à la charge de la famille. Le caissier
 * doit voir cet écart sans ouvrir la fiche, sinon il réclame le mauvais
 * montant. Le réaffecté partage le ton de l'affecté parce qu'il est
 * subventionné pareil, seule l'étiquette les distingue pour les dossiers du
 * ministère.
 *
 * « Non renseigné » reste volontairement neutre : c'est une information qui
 * manque, pas une alerte, et la teindre reviendrait à accuser une famille.
 */
export function AssignmentStatusBadge({ status, className }: AssignmentStatusBadgeProps) {
  const subsidised = status === "affecte" || status === "reaffecte"
  const unassigned = status === "non_affecte"

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium",
        subsidised &&
          "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
        unassigned && "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300",
        !subsidised && !unassigned && "border-dashed text-muted-foreground",
        className,
      )}
    >
      {assignmentStatusLabel(status)}
    </Badge>
  )
}
