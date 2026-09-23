"use client"

import type { AuditEntry } from "@/lib/contracts/audit"
import { comparableValue, fieldLabel, formatValue, relatedLabel } from "./audit-fields"

type Values = Record<string, unknown>

/**
 * Rend une valeur qui n'est pas scalaire : une liste de tranches, une
 * répartition de versement.
 *
 * `JSON.stringify` donnait une ligne que personne ne lisait. Une répartition
 * est ce qu'un parent conteste au guichet : elle doit se lire ligne à ligne.
 */
function StructuredValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">Aucun</span>
    return (
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li key={index} className="flex flex-wrap gap-x-2 gap-y-0.5">
            {typeof item === "object" && item !== null ? (
              <Pairs values={item as Values} />
            ) : (
              <span className="text-xs font-medium">{String(item)}</span>
            )}
          </li>
        ))}
      </ul>
    )
  }
  if (typeof value === "object" && value !== null) {
    return (
      <ul className="space-y-0.5">
        {Object.entries(value as Values).map(([key, raw]) => (
          <li key={key} className="text-xs">
            <Pair field={key} value={raw} />
          </li>
        ))}
      </ul>
    )
  }
  return <span>{String(value)}</span>
}

function Pair({ field, value }: { field: string; value: unknown }) {
  const rendu = formatValue(field, value)
  return (
    <>
      <span className="text-muted-foreground">{fieldLabel(field)} </span>
      <span className="font-medium">
        {rendu.kind === "text" ? rendu.text : <StructuredValue value={rendu.value} />}
      </span>
    </>
  )
}

function Pairs({ values }: { values: Values }) {
  return (
    <>
      {Object.entries(values).map(([key, raw]) => (
        <span key={key} className="whitespace-nowrap text-xs">
          <Pair field={key} value={raw} />
        </span>
      ))}
    </>
  )
}

function Cell({
  field,
  value,
  related,
  muted,
}: {
  field: string
  value: unknown
  related: AuditEntry["related_entities"]
  muted?: boolean
}) {
  const rendu = formatValue(field, value)
  const nom = relatedLabel(field, value, related)
  return (
    <td className={`px-3 py-2 align-top ${muted ? "text-muted-foreground" : ""}`}>
      {rendu.kind === "structured" ? (
        <StructuredValue value={rendu.value} />
      ) : nom ? (
        <>
          <span className="font-medium">{nom}</span>
          <span className="ml-1 text-xs text-muted-foreground">n° {rendu.text}</span>
        </>
      ) : (
        rendu.text
      )}
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
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter(
    (key) => comparableValue(key, before[key]) !== comparableValue(key, after[key]),
  )

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
                <Cell field={key} value={before[key]} related={entry.related_entities} muted />
                {suppression ? null : (
                  <Cell field={key} value={after[key]} related={entry.related_entities} />
                )}
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
