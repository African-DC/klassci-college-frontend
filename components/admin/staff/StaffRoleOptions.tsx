"use client"

import { SelectItem } from "@/components/ui/select"
import { STAFF_ROLE_OPTIONS } from "@/lib/contracts/staff"

/**
 * Options du sélecteur de rôle d'accès, partagées par la création et l'édition
 * d'un membre du personnel.
 *
 * Le libellé seul ne suffit plus depuis qu'il y a six rôles : « Directeur » et
 * « Directeur des études » se ressemblent alors que leurs droits n'ont rien à
 * voir. Chaque entrée porte donc une phrase qui dit ce que la personne pourra
 * faire.
 */
export function StaffRoleOptions() {
  return (
    <>
      {STAFF_ROLE_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value} className="py-2.5">
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">{option.label}</span>
            {/* `opacity` plutôt que `text-muted-foreground` : la ligne survolée
                ou sélectionnée passe sur fond accent, et une couleur figée y
                perdrait son contraste. En héritant du texte courant, la phrase
                reste lisible sur les deux fonds, y compris en plein soleil. */}
            <span className="text-xs opacity-70">{option.hint}</span>
          </span>
        </SelectItem>
      ))}
    </>
  )
}
