import type { AuditEntry } from "@/lib/contracts/audit"
import { entityLabel } from "./audit-labels"

/** Ce qu'on dit d'une fiche qui n'est plus dans les listes. */
const ETATS: Record<string, string> = {
  archived: "fiche archivée",
  deleted: "fiche supprimée",
}

/**
 * Sur quoi porte une ligne : le nom d'abord, le numéro ensuite, en petit.
 *
 * Un humain cherche « 6e B », pas « classe 12 ». Le numéro reste visible pour
 * qui doit recouper, mais il ne prend plus la place du nom. Quand la fiche a
 * été archivée ou supprimée, on le dit : un numéro qui ne mène nulle part sans explication
 * laisse croire à une erreur de l'écran.
 */
export function AuditSubject({ entry }: { entry: AuditEntry }) {
  const type = entityLabel(entry.entity_type)
  const nom = entry.subject_label
  const numero = entry.entity_id ? `n° ${entry.entity_id}` : null
  const etat = ETATS[entry.subject_state ?? ""] ?? null

  const precision = [type, nom ? numero : null, etat]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{nom ?? (numero ? `${type} ${numero}` : type)}</p>
      {nom || etat ? (
        <p className="truncate text-xs text-muted-foreground">{precision}</p>
      ) : null}
    </div>
  )
}
