"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FeeCategoryCreateModal } from "./FeeCategoryCreateModal"
import { FeeCategoryEditModal } from "./FeeCategoryEditModal"
import { FeeVariantCreateModal } from "./FeeVariantCreateModal"
import { FeeVariantEditModal } from "./FeeVariantEditModal"
import { useFeeCategories, useFeeVariants, useDeleteFeeCategory, useDeleteFeeVariant } from "@/lib/hooks/useFees"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useLevels } from "@/lib/hooks/useLevels"
import type { FeeCategory, FeeVariant } from "@/lib/contracts/fee"

export function FeesPageClient() {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<FeeCategory | null>(null)
  const [editVariant, setEditVariant] = useState<FeeVariant | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "variant"; id: number; name: string } | null>(null)

  const { data: academicYearsData } = useAcademicYears()
  const currentYearId = academicYearsData?.items?.[0]?.id

  const { data: categories, isLoading: loadingCategories } = useFeeCategories()
  const { data: variants, isLoading: loadingVariants } = useFeeVariants(currentYearId)
  const { data: levelsData } = useLevels()
  const levels = levelsData?.items ?? []
  const { mutate: deleteCategory, isPending: deletingCategory } = useDeleteFeeCategory()
  const { mutate: deleteVariant, isPending: deletingVariant } = useDeleteFeeVariant()

  // Lookup maps for display names
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

      {/* Catégories */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Catégories de frais</CardTitle>
          <Button size="sm" onClick={() => setCategoryModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle catégorie
          </Button>
        </CardHeader>
        <CardContent>
          {loadingCategories ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>
                      <Badge variant={cat.is_mandatory ? "destructive" : "secondary"}>
                        {cat.is_mandatory ? "Obligatoire" : "Optionnel"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cat.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditCategory(cat)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Modifier {cat.name}</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget({ type: "category", id: cat.id, name: cat.name })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Supprimer {cat.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune catégorie. Créez-en une pour commencer.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Variantes (montants par niveau) */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Montants par niveau</CardTitle>
          <Button size="sm" onClick={() => setVariantModalOpen(true)} disabled={!currentYearId}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle variante
          </Button>
        </CardHeader>
        <CardContent>
          {loadingVariants ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : variants && variants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead className="text-right">Montant (FC)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((v) => {
                  const catName = categoryNameMap.get(v.fee_category_id) ?? `#${v.fee_category_id}`
                  const lvlName = levelNameMap.get(v.level_id) ?? `#${v.level_id}`
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{catName}</TableCell>
                      <TableCell>{lvlName}{v.series_id ? ` (série)` : ""}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {v.amount.toLocaleString("fr-FR")} FC
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditVariant(v)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Modifier {catName} {lvlName}</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget({ type: "variant", id: v.id, name: `${catName} ${lvlName}` })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Supprimer {catName} {lvlName}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune variante. Créez des catégories d&apos;abord, puis définissez les montants par niveau.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modals de création */}
      <FeeCategoryCreateModal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
      {currentYearId && (
        <FeeVariantCreateModal
          open={variantModalOpen}
          onClose={() => setVariantModalOpen(false)}
          academicYearId={currentYearId}
        />
      )}

      {/* Modals d'édition */}
      <FeeCategoryEditModal
        category={editCategory}
        onClose={() => setEditCategory(null)}
      />
      <FeeVariantEditModal
        variant={editVariant}
        onClose={() => setEditVariant(null)}
      />

      {/* Dialog de confirmation de suppression */}
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
