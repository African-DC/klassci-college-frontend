"use client"

import { Pencil, Plus, Shield, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { premiumCardHover } from "@/components/shared/PageHero"
import { EntitlementsPopover } from "@/components/shared/fees/FeeEntitlements"
import { feeSumLabel } from "@/lib/contracts/fee-audience"
import type { FeeCategory, FeeVariant } from "@/lib/contracts/fee"

interface MandatoryFeeCategoryGridProps {
  categories: FeeCategory[]
  variantsByCategory: Map<number, FeeVariant[]>
  isLoading: boolean
  onEdit: (category: FeeCategory) => void
  onDelete: (category: FeeCategory) => void
  onCreate: () => void
}

/**
 * Les définitions des frais obligatoires, une carte par catégorie.
 *
 * La carte affiche une somme de montants : elle ne peut donc pas s'annoncer
 * autrement que la grille par niveau et que la KPI du hero, sous peine de
 * donner trois chiffres qui ne se recoupent pas pour une même école. Le
 * libellé vient du contrat, un seul endroit décide.
 */
export function MandatoryFeeCategoryGrid({
  categories,
  variantsByCategory,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
}: MandatoryFeeCategoryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Shield className="mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">Aucun frais obligatoire</p>
          <Button size="sm" variant="outline" className="mt-3 h-11 sm:h-9" onClick={onCreate}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Créer une catégorie
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => {
        const catVariants = variantsByCategory.get(cat.id) ?? []
        const totalAmount = catVariants.reduce((sum, v) => sum + v.amount, 0)
        // La somme couvre plusieurs niveaux, ou des publics qui s'excluent :
        // dans les deux cas elle n'est pas ce qu'un élève paie, et elle doit
        // le dire comme le dit la grille par niveau.
        const niveaux = new Set(catVariants.map((v) => v.level_id)).size
        const cumul =
          niveaux > 1 || catVariants.some((v) => v.assignment_scope || v.enrollment_profile)

        return (
          <Card
            key={cat.id}
            className={`border border-primary/20 bg-primary/[0.06] shadow-sm ${premiumCardHover}`}
          >
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{cat.name}</h3>
                    {cat.accepts_in_kind ? (
                      <p className="text-[10px] font-medium text-sky-700 dark:text-sky-400">
                        Dépôt en nature accepté
                      </p>
                    ) : cat.description ? (
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {cat.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                {/* 44 px de haut sur téléphone : la corbeille est à un doigt
                    du crayon, et un bouton de 28 px se rate sans survol. */}
                <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-11 w-10 sm:h-8 sm:w-8"
                    onClick={() => onEdit(cat)}
                    aria-label={`Modifier la catégorie ${cat.name}`}
                  >
                    <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-11 w-10 sm:h-8 sm:w-8"
                    onClick={() => onDelete(cat)}
                    aria-label={`Supprimer la catégorie ${cat.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive sm:h-3.5 sm:w-3.5" />
                  </Button>
                </div>
              </div>

              <EntitlementsPopover
                categoryName={cat.name}
                entitlements={cat.entitlements}
                fallbackNote={cat.description}
                className="-ml-2 mb-1"
              />

              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-xs text-muted-foreground">
                  {/*
                    Le compte porte sur les NIVEAUX, pas sur les tarifs. Le
                    profil multiplie precisement le nombre de tarifs par
                    niveau, universel plus nouveaux plus anciens : compter les
                    variantes ferait annoncer neuf niveaux a une categorie qui
                    en couvre trois.
                  */}
                  <span className="font-medium text-foreground">{niveaux}</span>{" "}
                  {niveaux > 1 ? "niveaux" : "niveau"}
                </span>
                {totalAmount > 0 && (
                  <span className="flex items-baseline gap-1.5 text-xs">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {feeSumLabel(cumul)}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {totalAmount.toLocaleString("fr-FR")} FCFA
                    </span>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
