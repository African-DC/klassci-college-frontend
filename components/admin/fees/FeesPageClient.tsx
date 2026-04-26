"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Wallet, Search, X, Shield, CircleDot, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FeeCategoryCreateModal } from "./FeeCategoryCreateModal"
import { FeeCategoryEditModal } from "./FeeCategoryEditModal"
import { FeeVariantCreateModal } from "./FeeVariantCreateModal"
import { FeeVariantEditModal } from "./FeeVariantEditModal"
import { FeeOptionsDialog } from "./FeeOptionsDialog"
import { useFeeCategories, useFeeVariants, useDeleteFeeCategory, useDeleteFeeVariant } from "@/lib/hooks/useFees"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useLevels } from "@/lib/hooks/useLevels"
import type { FeeCategory, FeeVariant } from "@/lib/contracts/fee"

// Colors based on mandatory/optional type — semantic, not arbitrary
const MANDATORY_COLOR = { bg: "bg-rose-50/60", border: "border-rose-200/80", icon: "bg-rose-100 text-rose-600" }
const OPTIONAL_COLOR = { bg: "bg-blue-50/60", border: "border-blue-200/80", icon: "bg-blue-100 text-blue-600" }

export function FeesPageClient() {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<FeeCategory | null>(null)
  const [editVariant, setEditVariant] = useState<FeeVariant | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "variant"; id: number; name: string } | null>(null)
  const [optionsCategory, setOptionsCategory] = useState<FeeCategory | null>(null)
  const [searchVariant, setSearchVariant] = useState("")

  const { data: academicYearsData } = useAcademicYears()
  const currentYearId = academicYearsData?.items?.[0]?.id

  const { data: categories, isLoading: loadingCategories } = useFeeCategories()
  const { data: variants, isLoading: loadingVariants } = useFeeVariants(currentYearId)
  const { data: levelsData } = useLevels()
  const levels = levelsData?.items ?? []
  const { mutate: deleteCategory, isPending: deletingCategory } = useDeleteFeeCategory()
  const { mutate: deleteVariant, isPending: deletingVariant } = useDeleteFeeVariant()

  const categoryNameMap = useMemo(() => {
    const map = new Map<number, string>()
    categories?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])
  const levelNameMap = useMemo(() => {
    const map = new Map<number, string>()
    levels.forEach((l) => map.set(l.id, l.name))
    return map
  }, [levels])

  // Group variants by category for display
  const variantsByCategory = useMemo(() => {
    const map = new Map<number, FeeVariant[]>()
    variants?.forEach((v) => {
      const existing = map.get(v.fee_category_id) ?? []
      existing.push(v)
      map.set(v.fee_category_id, existing)
    })
    return map
  }, [variants])

  // Filter variants by search
  const filteredVariants = useMemo(() => {
    if (!variants || !searchVariant.trim()) return variants ?? []
    const q = searchVariant.toLowerCase()
    return variants.filter((v) => {
      const catName = categoryNameMap.get(v.fee_category_id) ?? ""
      const lvlName = levelNameMap.get(v.level_id) ?? ""
      return catName.toLowerCase().includes(q) || lvlName.toLowerCase().includes(q)
    })
  }, [variants, searchVariant, categoryNameMap, levelNameMap])

  // KPI totals
  const totalMandatory = categories?.filter((c) => c.is_mandatory).length ?? 0
  const totalOptional = categories?.filter((c) => !c.is_mandatory).length ?? 0
  const totalVariants = variants?.length ?? 0

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const onSuccess = () => setDeleteTarget(null)
    if (deleteTarget.type === "category") {
      deleteCategory(deleteTarget.id, { onSuccess })
    } else {
      deleteVariant(deleteTarget.id, { onSuccess })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header premium */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight">Frais scolaires</h1>
            <p className="text-sm text-muted-foreground">
              Configuration des catégories de frais et montants par niveau
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setVariantModalOpen(true)} disabled={!currentYearId}>
            <Layers className="mr-2 h-4 w-4" />
            Nouvelle variante
          </Button>
          <Button onClick={() => setCategoryModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle catégorie
          </Button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Obligatoires</p>
              <p className="text-xl font-bold">{totalMandatory}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <CircleDot className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Optionnels</p>
              <p className="text-xl font-bold">{totalOptional}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
              <Layers className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Variantes</p>
              <p className="text-xl font-bold">{totalVariants}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories as premium cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Catégories de frais</h2>
        {loadingCategories ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const color = cat.is_mandatory ? MANDATORY_COLOR : OPTIONAL_COLOR
              const catVariants = variantsByCategory.get(cat.id) ?? []
              const totalAmount = catVariants.reduce((sum, v) => sum + v.amount, 0)
              return (
                <Card key={cat.id} className={`border ${color.border} ${color.bg} shadow-sm hover:shadow-md transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color.icon}`}>
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{cat.name}</h3>
                          {cat.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{cat.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={cat.is_mandatory ? "destructive" : "secondary"} className="text-[10px] h-5">
                        {cat.is_mandatory ? "Obligatoire" : "Optionnel"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{catVariants.length}</span> niveau(x) configuré(s)
                      </div>
                      {totalAmount > 0 && (
                        <div className="text-xs font-semibold tabular-nums">
                          {totalAmount.toLocaleString("fr-FR")} FCFA
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                      {!cat.is_mandatory && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setOptionsCategory(cat)}>
                          Options
                        </Button>
                      )}
                      <div className="flex-1" />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditCategory(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setDeleteTarget({ type: "category", id: cat.id, name: cat.name })}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Wallet className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Aucune catégorie de frais</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setCategoryModalOpen(true)}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Créer une catégorie
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Variantes (montants par niveau) avec search */}
      <Card className="border-0 shadow-sm ring-1 ring-border overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Montants par niveau
          </CardTitle>
          <div className="relative w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchVariant}
              onChange={(e) => setSearchVariant(e.target.value)}
              className="h-8 pl-8 pr-8 text-xs"
            />
            {searchVariant && (
              <button
                onClick={() => setSearchVariant("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingVariants ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : filteredVariants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Catégorie</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Niveau</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Montant</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariants.map((v) => {
                    const catName = categoryNameMap.get(v.fee_category_id) ?? `#${v.fee_category_id}`
                    const lvlName = levelNameMap.get(v.level_id) ?? `#${v.level_id}`
                    return (
                      <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3 font-medium">{catName}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{lvlName}</Badge>
                          {v.series_id && <span className="ml-1 text-xs text-muted-foreground">(série)</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {v.amount.toLocaleString("fr-FR")} <span className="text-xs text-muted-foreground">FCFA</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditVariant(v)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setDeleteTarget({ type: "variant", id: v.id, name: `${catName} ${lvlName}` })}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Layers className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">
                {searchVariant ? "Aucune variante correspondante" : "Aucune variante configurée"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <FeeCategoryCreateModal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
      {currentYearId && (
        <FeeVariantCreateModal
          open={variantModalOpen}
          onClose={() => setVariantModalOpen(false)}
          academicYearId={currentYearId}
        />
      )}
      <FeeCategoryEditModal category={editCategory} onClose={() => setEditCategory(null)} />
      <FeeVariantEditModal variant={editVariant} onClose={() => setEditVariant(null)} />
      <FeeOptionsDialog category={optionsCategory} academicYearId={currentYearId} onClose={() => setOptionsCategory(null)} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer &quot;{deleteTarget?.name}&quot; ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les paiements liés pourraient être affectés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletingCategory || deletingVariant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingCategory || deletingVariant ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
