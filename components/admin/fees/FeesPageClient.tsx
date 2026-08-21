"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Wallet, Shield, CircleDot, Layers, Coins, Copy, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero, SectionTitle, heroGlassBtn, heroAccentBtn, premiumCardHover } from "@/components/shared/PageHero"
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
import { FeeVariantCopyModal } from "./FeeVariantCopyModal"
import { FeesByLevelTree } from "./FeesByLevelTree"
import { OptionalCategoryPanel } from "./OptionalCategoryPanel"
import { useFeeCategories, useFeeVariants, useDeleteFeeCategory, useDeleteFeeVariant } from "@/lib/hooks/useFees"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useLevels } from "@/lib/hooks/useLevels"
import type { FeeCategory, FeeVariant } from "@/lib/contracts/fee"

export function FeesPageClient() {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<FeeCategory | null>(null)
  const [editVariant, setEditVariant] = useState<FeeVariant | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "variant"; id: number; name: string } | null>(null)

  const { data: academicYearsData } = useAcademicYears()
  const currentYearId = academicYearsData?.items?.[0]?.id

  const { data: categories, isLoading: loadingCategories } = useFeeCategories()
  const { data: variants, isLoading: loadingVariants } = useFeeVariants(currentYearId)
  const { data: levelsData } = useLevels()
  const levels = useMemo(() => levelsData?.items ?? [], [levelsData])
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

  const variantsByCategory = useMemo(() => {
    const map = new Map<number, FeeVariant[]>()
    variants?.forEach((v) => {
      const existing = map.get(v.fee_category_id) ?? []
      existing.push(v)
      map.set(v.fee_category_id, existing)
    })
    return map
  }, [variants])

  const mandatoryCategories = useMemo(() => (categories ?? []).filter((c) => c.is_mandatory), [categories])
  const optionalCategories = useMemo(() => (categories ?? []).filter((c) => !c.is_mandatory), [categories])

  // KPIs
  const totalMandatory = mandatoryCategories.length
  const totalOptional = optionalCategories.length
  const configuredLevels = useMemo(() => new Set((variants ?? []).map((v) => v.level_id)).size, [variants])
  const totalConfigured = variants?.reduce((sum, v) => sum + v.amount, 0) ?? 0

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
      {/* Hero signature KLASSCI (dégradé bleu -> orange + KPIs intégrés) */}
      <PageHero
        icon={Wallet}
        title="Frais scolaires"
        subtitle="Grille tarifaire par niveau et frais optionnels"
        actions={
          <>
            <button
              type="button"
              className={`${heroGlassBtn} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => setVariantModalOpen(true)}
              disabled={!currentYearId}
            >
              <Layers className="h-4 w-4" />
              Nouveau montant
            </button>
            <button type="button" className={heroAccentBtn} onClick={() => setCategoryModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle catégorie
            </button>
          </>
        }
        kpis={[
          { label: "Frais obligatoires", value: totalMandatory, icon: Shield },
          { label: "Frais optionnels", value: totalOptional, icon: CircleDot },
          { label: "Niveaux configurés", value: configuredLevels, icon: GraduationCap },
          { label: "Montant configuré", value: `${totalConfigured.toLocaleString("fr-FR")} F`, icon: Coins },
        ]}
      />

      {/* ── Frais obligatoires ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle icon={Shield}>Frais obligatoires</SectionTitle>

        {/* Catégories obligatoires (définitions) */}
        {loadingCategories ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : mandatoryCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mandatoryCategories.map((cat) => {
              const catVariants = variantsByCategory.get(cat.id) ?? []
              const totalAmount = catVariants.reduce((sum, v) => sum + v.amount, 0)
              return (
                <Card key={cat.id} className={`border border-primary/20 bg-primary/[0.06] shadow-sm ${premiumCardHover}`}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Wallet className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold">{cat.name}</h3>
                          {cat.description && (
                            <p className="line-clamp-1 text-[11px] text-muted-foreground">{cat.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditCategory(cat)} aria-label="Modifier la catégorie">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setDeleteTarget({ type: "category", id: cat.id, name: cat.name })}
                          aria-label="Supprimer la catégorie"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{catVariants.length}</span> niveau(x)
                      </span>
                      {totalAmount > 0 && (
                        <span className="text-xs font-semibold tabular-nums">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Shield className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">Aucun frais obligatoire</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setCategoryModalOpen(true)}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Créer une catégorie
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Grille par niveau (arbre) */}
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle icon={Coins}>Grille par niveau</SectionTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9"
                  onClick={() => setCopyModalOpen(true)}
                  disabled={!currentYearId || (variants?.length ?? 0) === 0}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copier des montants
                </Button>
                <Button size="sm" className="h-9" onClick={() => setVariantModalOpen(true)} disabled={!currentYearId}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nouveau montant
                </Button>
              </div>
            </div>
            {loadingVariants ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : (
              <FeesByLevelTree
                levels={levels}
                variants={variants ?? []}
                categoryNameMap={categoryNameMap}
                onEditVariant={(v) => setEditVariant(v)}
                onDeleteVariant={(v) =>
                  setDeleteTarget({
                    type: "variant",
                    id: v.id,
                    name: `${categoryNameMap.get(v.fee_category_id) ?? "Frais"} · ${levelNameMap.get(v.level_id) ?? ""}`,
                  })
                }
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Frais optionnels ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon={CircleDot}>Frais optionnels</SectionTitle>
          <p className="text-xs text-muted-foreground">Options proposées à l&apos;inscription (cantine, transport…)</p>
        </div>
        {loadingCategories ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : optionalCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {optionalCategories.map((cat) => (
              <OptionalCategoryPanel
                key={cat.id}
                category={cat}
                academicYearId={currentYearId}
                onEditCategory={(c) => setEditCategory(c)}
                onDeleteCategory={(c) => setDeleteTarget({ type: "category", id: c.id, name: c.name })}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CircleDot className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">Aucun frais optionnel</p>
              <p className="text-xs">Créez une catégorie et décochez « obligatoire » pour proposer des options.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Modals */}
      <FeeCategoryCreateModal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
      {currentYearId && (
        <>
          <FeeVariantCreateModal
            open={variantModalOpen}
            onClose={() => setVariantModalOpen(false)}
            academicYearId={currentYearId}
          />
          <FeeVariantCopyModal
            open={copyModalOpen}
            onClose={() => setCopyModalOpen(false)}
            mandatoryCategories={mandatoryCategories}
            variants={variants ?? []}
            levelNameMap={levelNameMap}
            academicYearId={currentYearId}
          />
        </>
      )}
      <FeeCategoryEditModal category={editCategory} onClose={() => setEditCategory(null)} />
      <FeeVariantEditModal key={editVariant?.id ?? "none"} variant={editVariant} onClose={() => setEditVariant(null)} />

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
