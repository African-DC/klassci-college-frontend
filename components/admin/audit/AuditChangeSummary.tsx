import { ArrowRight } from "lucide-react"
import type { AuditEntry } from "@/lib/contracts/audit"
import { AuditValue } from "./AuditValue"
import { changedKeys, fieldLabel } from "./audit-fields"

type Values = Record<string, unknown>

/** Au plus deux champs dans la liste : au-delà, la ligne ne se lit plus d'un coup d'œil. */
const MAX_CHAMPS = 2

function Valeur({ field, value, entry, muted }: {
  field: string
  value: unknown
  entry: AuditEntry
  muted?: boolean
}) {
  return (
    <span className={muted ? "text-muted-foreground" : "font-medium"}>
      <AuditValue field={field} value={value} entry={entry} compact />
    </span>
  )
}

/**
 * Ce qui a changé, directement dans la liste : « Nom : 6e A → 6e B ».
 *
 * Sans lui, une modification ne se lisait qu'en ouvrant le détail, ligne par
 * ligne. L'ancienne valeur s'affiche à côté de la nouvelle, sur le même
 * écran, sans être barrée : un texte gris et barré se lit mal sur un écran
 * d'entrée de gamme en plein soleil, et la flèche suffit à dire le sens.
 *
 * Quand l'état d'avant n'a pas été enregistré, on n'invente pas de flèche :
 * seule la nouvelle valeur s'affiche.
 */
export function AuditChangeSummary({ entry }: { entry: AuditEntry }) {
  if (entry.action !== "update") return null
  const before = (entry.old_values ?? {}) as Values
  const after = (entry.new_values ?? {}) as Values
  const keys = changedKeys(before, after)
  if (keys.length === 0) return null

  const avecAvant = Object.keys(before).length > 0
  const reste = keys.length - MAX_CHAMPS

  return (
    <ul className="space-y-0.5 text-xs">
      {keys.slice(0, MAX_CHAMPS).map((key) => (
        <li key={key} className="flex flex-wrap items-center gap-x-1.5">
          <span className="text-muted-foreground">{fieldLabel(key)} :</span>
          {avecAvant ? (
            <>
              <Valeur field={key} value={before[key]} entry={entry} muted />
              <ArrowRight aria-label="devient" className="h-3 w-3 text-muted-foreground" />
            </>
          ) : null}
          <Valeur field={key} value={after[key]} entry={entry} />
        </li>
      ))}
      {reste > 0 ? (
        <li className="text-muted-foreground">
          et {reste} autre{reste > 1 ? "s" : ""} champ{reste > 1 ? "s" : ""}
        </li>
      ) : null}
    </ul>
  )
}
