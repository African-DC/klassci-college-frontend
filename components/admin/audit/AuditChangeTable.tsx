"use client"

import type { AuditEntry } from "@/lib/contracts/audit"
import { AuditValue } from "./AuditValue"
import { changedKeys, fieldLabel } from "./audit-fields"

type Values = Record<string, unknown>

function Cell({
  field,
  value,
  entry,
  muted,
}: {
  field: string
  value: unknown
  entry: AuditEntry
  muted?: boolean
}) {
  return (
    <td className={`px-3 py-2 align-top ${muted ? "text-muted-foreground" : "font-medium"}`}>
      <AuditValue field={field} value={value} entry={entry} />
    </td>
  )
}

/**
 * L'avant et l'après, champ par champ.
 *
 * Seuls les champs qui ont réellement changé sont listés : un numéro de
 * téléphone modifié au milieu de quarante champs identiques serait
 * introuvable, et c'est exactement ce qu'on vient chercher ici. La comparaison
 * porte sur ce que le lecteur verra, pas sur la valeur brute : deux écritures
 * différentes du même montant ne font pas une modification.
 *
 * Quand l'avant manque alors que l'action est une modification, on le dit.
 * Une case vide laisserait croire que le champ était vide, ce qui est faux.
 */
export function AuditChangeTable({ entry }: { entry: AuditEntry }) {
  const before = (entry.old_values ?? {}) as Values
  const after = (entry.new_values ?? {}) as Values
  const keys = changedKeys(before, after)

  if (keys.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        {entry.action === "read"
          ? "Une consultation ne modifie rien : il n'y a pas de valeurs à comparer."
          : "Aucune valeur enregistrée pour cette action."}
      </p>
    )
  }

  const sansAvant = entry.action === "update" && Object.keys(before).length === 0
  const suppression = entry.action === "delete"

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Champ</th>
              <th className="px-3 py-2 text-left font-medium">
                {suppression ? "Valeur supprimée" : "Avant"}
              </th>
              {suppression ? null : <th className="px-3 py-2 text-left font-medium">Après</th>}
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key} className="border-b last:border-0">
                <td className="px-3 py-2 align-top font-medium">{fieldLabel(key)}</td>
                <Cell field={key} value={before[key]} entry={entry} muted />
                {suppression ? null : <Cell field={key} value={after[key]} entry={entry} />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sansAvant ? (
        <p className="text-xs text-muted-foreground">
          Les valeurs précédentes n&apos;ont pas été enregistrées pour cette action. Un tiret ne
          veut donc pas dire « champ vide », mais « valeur inconnue ».
        </p>
      ) : null}
    </div>
  )
}
