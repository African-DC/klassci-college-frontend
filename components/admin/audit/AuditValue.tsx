import { displayValue, fieldLabel, type NamedEntry } from "./audit-fields"

type Values = Record<string, unknown>

interface AuditValueProps {
  field: string
  value: unknown
  entry: NamedEntry
  /**
   * Version courte, pour une ligne de la liste : le nom sans son numéro, et
   * une structure réduite à un renvoi vers le détail.
   */
  compact?: boolean
}

/**
 * Une valeur du journal, telle qu'un humain la lit.
 *
 * Le résumé de la liste, le tableau du détail et chaque ligne d'une
 * répartition passent par ici : un identifiant s'y lit « 6e B » avec son
 * numéro en petit, où qu'il soit rangé.
 */
export function AuditValue({ field, value, entry, compact }: AuditValueProps) {
  const rendu = displayValue(field, value, entry)
  switch (rendu.kind) {
    case "text":
      return <>{rendu.text}</>
    case "named":
      return compact ? (
        <span title={rendu.ref}>{rendu.name}</span>
      ) : (
        <>
          {rendu.name}
          <span className="ml-1 text-xs font-normal text-muted-foreground">{rendu.ref}</span>
        </>
      )
    case "ref":
      return <span className="text-muted-foreground">{rendu.ref}</span>
    case "structured":
      return compact ? (
        <span className="text-muted-foreground">voir le détail</span>
      ) : (
        <StructuredValue value={rendu.value} entry={entry} />
      )
  }
}

/**
 * Une valeur qui n'est pas scalaire : une liste de tranches, une répartition
 * de versement.
 *
 * Une répartition est ce qu'un parent conteste au guichet : elle se lit ligne
 * à ligne, avec le nom du frais et non son numéro.
 */
function StructuredValue({ value, entry }: { value: unknown; entry: NamedEntry }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">Aucun</span>
    return (
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li key={index} className="flex flex-wrap gap-x-2 gap-y-0.5">
            {typeof item === "object" && item !== null ? (
              Object.entries(item as Values).map(([key, raw]) => (
                <span key={key} className="whitespace-nowrap text-xs">
                  <Pair field={key} value={raw} entry={entry} />
                </span>
              ))
            ) : (
              <span className="text-xs font-medium">{String(item)}</span>
            )}
          </li>
        ))}
      </ul>
    )
  }
  return (
    <ul className="space-y-0.5">
      {Object.entries((value ?? {}) as Values).map(([key, raw]) => (
        <li key={key} className="text-xs">
          <Pair field={key} value={raw} entry={entry} />
        </li>
      ))}
    </ul>
  )
}

function Pair({ field, value, entry }: { field: string; value: unknown; entry: NamedEntry }) {
  return (
    <>
      <span className="text-muted-foreground">{fieldLabel(field)} </span>
      <span className="font-medium">
        <AuditValue field={field} value={value} entry={entry} />
      </span>
    </>
  )
}
