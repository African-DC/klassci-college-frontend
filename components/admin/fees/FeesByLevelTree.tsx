"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Pencil, Trash2, GraduationCap, Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FeeVariant } from "@/lib/contracts/fee"

interface LevelLite {
  id: number
  name: string
}

interface FeesByLevelTreeProps {
  levels: LevelLite[]
  variants: FeeVariant[]
  categoryNameMap: Map<number, string>
  onEditVariant: (variant: FeeVariant) => void
  onDeleteVariant: (variant: FeeVariant) => void
}

/**
 * Grille des frais obligatoires en arbre par niveau : un noeud par niveau
 * (total à payer + nombre de frais), déplié pour révéler chaque montant
 * (catégorie → montant) avec édition/suppression. Remplace le tableau plat
 * « Montants par niveau » : on lit d'un coup ce qu'un élève d'un niveau paie,
 * ce qui colle au modèle de paiement (le versement s'alloue sur l'inscription).
 */
export function FeesByLevelTree({
  levels,
  variants,
  categoryNameMap,
  onEditVariant,
  onDeleteVariant,
}: FeesByLevelTreeProps) {
  // Regroupe les variantes par niveau.
  const byLevel = useMemo(() => {
    const map = new Map<number, FeeVariant[]>()
    for (const v of variants) {
      const arr = map.get(v.level_id) ?? []
      arr.push(v)
      map.set(v.level_id, arr)
    }
    return map
  }, [variants])

  // Niveaux à afficher : ceux du référentiel qui ont au moins un montant,
  // dans l'ordre du référentiel (6eme -> 3eme).
  const rows = useMemo(
    () =>
      levels
        .map((lvl) => ({ level: lvl, items: byLevel.get(lvl.id) ?? [] }))
        .filter((r) => r.items.length > 0),
    [levels, byLevel],
  )

  // Déplié par défaut : on suit les niveaux explicitement REPLIÉS par l'admin.
  // (Un état "ouverts" initialisé au montage raterait les niveaux dont les
  // variantes arrivent après le premier rendu.)
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set())

  function toggle(levelId: number) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(levelId)) next.delete(levelId)
      else next.add(levelId)
      return next
    })
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground">
        <Coins className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">Aucun montant configuré</p>
        <p className="text-xs">Ajoutez un montant pour définir la grille tarifaire d&apos;un niveau.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {rows.map(({ level, items }) => {
        const isOpen = !collapsed.has(level.id)
        const total = items.reduce((sum, v) => sum + v.amount, 0)
        return (
          <div
            key={level.id}
            className="overflow-hidden rounded-xl border border-border/70 bg-muted/30"
          >
            {/* En-tête niveau (couche 3, encaissée) */}
            <button
              type="button"
              onClick={() => toggle(level.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-90",
                )}
              />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{level.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {items.length} frais obligatoire{items.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total / élève</p>
                <p className="text-sm font-bold tabular-nums">
                  {total.toLocaleString("fr-FR")} <span className="text-[11px] font-normal text-muted-foreground">FCFA</span>
                </p>
              </div>
            </button>

            {/* Corps : montants par catégorie (couche 5) */}
            {isOpen && (
              <div className="border-t border-border/60 bg-background">
                {items.map((v) => {
                  const catName = categoryNameMap.get(v.fee_category_id) ?? `Catégorie #${v.fee_category_id}`
                  return (
                    <div
                      key={v.id}
                      className="group flex items-center gap-3 border-b border-border/50 px-3.5 py-2.5 last:border-0 hover:bg-muted/30"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{catName}</span>
                      {v.series_id && (
                        <Badge variant="outline" className="h-5 text-[10px]">
                          série
                        </Badge>
                      )}
                      {v.assignment_scope ? (
                        // Sans ce repere, deux montants sur le meme niveau
                        // passent pour un doublon alors qu'ils visent des
                        // eleves differents.
                        <Badge
                          variant="outline"
                          className={
                            v.assignment_scope === "affecte"
                              ? "h-5 border-emerald-300 text-[10px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                              : "h-5 border-amber-300 text-[10px] text-amber-700 dark:border-amber-800 dark:text-amber-300"
                          }
                        >
                          {v.assignment_scope === "affecte" ? "affecté" : "non affecté"}
                        </Badge>
                      ) : null}
                      <span className="text-sm font-semibold tabular-nums">
                        {v.amount.toLocaleString("fr-FR")}{" "}
                        <span className="text-[11px] font-normal text-muted-foreground">FCFA</span>
                      </span>
                      <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onEditVariant(v)}
                          aria-label={`Modifier ${catName}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onDeleteVariant(v)}
                          aria-label={`Supprimer ${catName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
