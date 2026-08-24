"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  ENTITLEMENT_KINDS,
  MAX_ENTITLEMENTS,
  type FeeEntitlement,
} from "@/lib/contracts/fee"

/**
 * Saisie de ce qu'un frais donne droit, ligne par ligne.
 *
 * Une zone de texte nue ne guide personne : le secrétariat écrit une phrase,
 * et plus rien ne permet de séparer le polo qu'on remet de la bibliothèque
 * qu'on ouvre. Ici chaque ligne porte sa nature, et l'exemple reste visible
 * tant que rien n'est saisi, pour que la première ligne s'écrive d'elle-même.
 */

const EXEMPLE: FeeEntitlement[] = [
  { label: "tenue de sport", quantity: 1, kind: "item" },
  { label: "macarons", quantity: 2, kind: "item" },
  { label: "polo", quantity: 1, kind: "item" },
  { label: "infirmerie", quantity: null, kind: "access" },
  { label: "bibliothèque", quantity: null, kind: "access" },
  { label: "activités extra-scolaires", quantity: null, kind: "access" },
]

interface FeeEntitlementsFieldProps {
  value: FeeEntitlement[] | undefined
  onChange: (value: FeeEntitlement[]) => void
}

export function FeeEntitlementsField({ value, onChange }: FeeEntitlementsFieldProps) {
  const lignes = value ?? []
  const complet = lignes.length >= MAX_ENTITLEMENTS

  function modifier(index: number, patch: Partial<FeeEntitlement>) {
    onChange(lignes.map((ligne, i) => (i === index ? { ...ligne, ...patch } : ligne)))
  }

  function ajouter(kind: "item" | "access") {
    if (complet) return
    onChange([...lignes, { label: "", quantity: kind === "item" ? 1 : null, kind }])
  }

  function retirer(index: number) {
    onChange(lignes.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Ce que ce frais donne droit</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Ce qui apparaîtra sur le reçu de la famille. Séparez ce qu&apos;elle vient retirer de ce
          à quoi elle accède.
        </p>
      </div>

      {lignes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Exemple, pour des frais de tenue :
          </p>
          <ul className="mt-1.5 space-y-0.5 pl-5">
            {EXEMPLE.map((e) => (
              <li key={e.label} className="list-disc text-xs text-muted-foreground">
                {e.quantity ? `${e.quantity} ${e.label}` : e.label}
                <span className="ml-1.5 text-[11px] italic">
                  {e.kind === "item" ? "à retirer" : "accès"}
                </span>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2.5 h-11 w-full sm:h-9"
            onClick={() => onChange(EXEMPLE.map((e) => ({ ...e })))}
          >
            Partir de cet exemple
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {lignes.map((ligne, index) => {
            const estObjet = ligne.kind === "item"
            return (
              <li key={index} className="flex items-start gap-2">
                <div className="flex flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    inputMode="numeric"
                    aria-label={`Quantité, ligne ${index + 1}`}
                    placeholder="—"
                    className="h-11 w-16 shrink-0 text-center sm:h-10"
                    value={ligne.quantity ?? ""}
                    onChange={(event) => {
                      const brut = event.target.value
                      modifier(index, { quantity: brut === "" ? null : Number(brut) })
                    }}
                  />
                  <Input
                    aria-label={`Libellé, ligne ${index + 1}`}
                    placeholder={estObjet ? "Ex : polo" : "Ex : bibliothèque"}
                    className="h-11 min-w-0 flex-1 sm:h-10"
                    value={ligne.label}
                    onChange={(event) => modifier(index, { label: event.target.value })}
                  />
                  <div className="flex shrink-0 overflow-hidden rounded-md border border-border">
                    {ENTITLEMENT_KINDS.map((k) => (
                      <button
                        key={k.value}
                        type="button"
                        title={k.hint}
                        aria-pressed={ligne.kind === k.value}
                        className={cn(
                          "h-11 px-2.5 text-[11px] font-medium transition-colors sm:h-10",
                          ligne.kind === k.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted",
                        )}
                        onClick={() =>
                          modifier(index, {
                            kind: k.value,
                            // Un accès ne se compte pas : « 1 infirmerie » n'a
                            // aucun sens sur un reçu.
                            quantity: k.value === "access" ? null : (ligne.quantity ?? 1),
                          })
                        }
                      >
                        {k.value === "item" ? "Remis" : "Accès"}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 shrink-0 sm:h-10 sm:w-10"
                  aria-label={`Retirer la ligne ${index + 1}${ligne.label ? ` : ${ligne.label}` : ""}`}
                  onClick={() => retirer(index)}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 flex-1 sm:h-9"
          disabled={complet}
          onClick={() => ajouter("item")}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Objet remis
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 flex-1 sm:h-9"
          disabled={complet}
          onClick={() => ajouter("access")}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Droit d&apos;accès
        </Button>
      </div>
      {complet && (
        <p className="text-xs text-muted-foreground">
          Maximum atteint : {MAX_ENTITLEMENTS} éléments. Au-delà, la contrepartie ne tient plus
          sur un reçu.
        </p>
      )}
    </div>
  )
}
