"use client"

import { useMemo, useState } from "react"
import { ArrowRightLeft, ChevronRight, Pencil, Trash2, GraduationCap, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeeVariantAudienceBadges } from "./FeeVariantAudienceBadges"
import { cn } from "@/lib/utils"
import { feeSumLabel } from "@/lib/contracts/fee-audience"
import type { FeeVariant } from "@/lib/contracts/fee"

interface LevelLite {
  id: number
  name: string
}

/**
 * Cible tactile des actions de ligne : 44 px de haut sur téléphone.
 *
 * Mme Diallo corrige un tarif sur un Itel de 5,5 pouces. Un bouton de 28 px
 * s'y rate une fois sur deux, et le raté tombe sur la corbeille aussi souvent
 * que sur le crayon. La largeur descend à 40 px pour que trois actions, le
 * montant et le nom tiennent sur la même ligne.
 */
const actionBtn = "h-11 w-10 sm:h-8 sm:w-8"
const actionIcon = "h-4 w-4 sm:h-3.5 sm:w-3.5"

interface FeesByLevelTreeProps {
  levels: LevelLite[]
  variants: FeeVariant[]
  categoryNameMap: Map<number, string>
  onEditVariant: (variant: FeeVariant) => void
  onDeleteVariant: (variant: FeeVariant) => void
  /**
   * Rouvre la question de la répercussion sur les inscriptions existantes.
   *
   * Elle est posée d'elle-même après une modification de montant. La reposer
   * ici est ce qui rend le refus sans conséquence : dire non sur le moment ne
   * ferme pas la porte, on revient quand la décision est prise.
   */
  onPropagateVariant: (variant: FeeVariant) => void
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
  onPropagateVariant,
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
        // Dès qu'un tarif du niveau vise un public précis, la somme cesse
        // d'être ce qu'un élève paie : elle additionne des montants qui
        // s'excluent. On dit alors ce qu'elle est vraiment, plutôt que
        // d'annoncer à l'école un montant que personne ne réglera.
        // La serie compte comme les deux autres dimensions : deux tarifs de series
    // differentes s'excluent, les additionner ne donne ce que paie aucun eleve.
    const cible = items.some(
      (v) => v.assignment_scope || v.enrollment_profile || v.series_id != null,
    )
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
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {feeSumLabel(cible)}
                </p>
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
                      className="group flex items-center gap-2 border-b border-border/50 px-2.5 py-1.5 last:border-0 hover:bg-muted/30 sm:gap-3 sm:px-3.5 sm:py-2.5"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                      {/* Les repères passent sous le nom : à trois dimensions
                          de ciblage, une seule ligne déborderait de l'écran
                          d'un téléphone avant d'arriver au montant. */}
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{catName}</span>
                        <FeeVariantAudienceBadges variant={v} className="mt-1" />
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {v.amount.toLocaleString("fr-FR")}{" "}
                        <span className="text-[11px] font-normal text-muted-foreground">FCFA</span>
                      </span>
                      {/* Sur un téléphone il n'y a pas de survol : les actions
                          restent visibles et font 44 px de haut. Le survol ne
                          reprend la main qu'à partir de la souris (sm). */}
                      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:gap-1 sm:opacity-60 sm:group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className={actionBtn}
                          onClick={() => onEditVariant(v)}
                          aria-label={`Modifier ${catName}`}
                        >
                          <Pencil className={actionIcon} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={actionBtn}
                          onClick={() => onPropagateVariant(v)}
                          aria-label={`Répercuter ${catName} sur les inscriptions`}
                          title="Répercuter sur les inscriptions"
                        >
                          <ArrowRightLeft className={actionIcon} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={actionBtn}
                          onClick={() => onDeleteVariant(v)}
                          aria-label={`Supprimer ${catName}`}
                        >
                          <Trash2 className={cn(actionIcon, "text-destructive")} />
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
