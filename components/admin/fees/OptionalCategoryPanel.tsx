"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type z } from "zod"
import { Plus, Pencil, Trash2, CircleDot, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EntitlementsPopover } from "@/components/shared/fees/FeeEntitlements"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
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
  useFeeOptions,
  useCreateFeeOption,
  useUpdateFeeOption,
  useDeleteFeeOption,
} from "@/lib/hooks/useFees"
import { OptionalFeeOptionFormSchema, type FeeCategory, type OptionalFeeOption } from "@/lib/contracts/fee"

interface OptionalCategoryPanelProps {
  category: FeeCategory
  academicYearId: number | undefined
  onEditCategory: (category: FeeCategory) => void
  onDeleteCategory: (category: FeeCategory) => void
}

type OptionForm = z.infer<typeof OptionalFeeOptionFormSchema>

/**
 * Frais optionnel présenté en clair : la catégorie et TOUTES ses options
 * (nom + montant) sont visibles inline et éditables sur place, au même titre
 * que les montants des frais obligatoires. Fini le cas des frais optionnels
 * relégué derrière un bouton « Options ».
 */
export function OptionalCategoryPanel({
  category,
  academicYearId,
  onEditCategory,
  onDeleteCategory,
}: OptionalCategoryPanelProps) {
  const [editing, setEditing] = useState<OptionalFeeOption | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OptionalFeeOption | null>(null)

  const { data: options, isLoading } = useFeeOptions(category.id)
  const { mutate: createOption, isPending: creating } = useCreateFeeOption()
  const { mutate: updateOption, isPending: updating } = useUpdateFeeOption()
  const { mutate: deleteOption, isPending: deleting } = useDeleteFeeOption()

  const form = useForm<OptionForm>({
    resolver: zodResolver(OptionalFeeOptionFormSchema),
    defaultValues: { name: "", amount: undefined, description: null },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ name: "", amount: undefined, description: null })
    setShowForm(true)
  }

  function openEdit(opt: OptionalFeeOption) {
    setEditing(opt)
    form.reset({ name: opt.name, amount: opt.amount, description: opt.description })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  function onSubmit(data: OptionForm) {
    if (!academicYearId) return
    if (editing) {
      updateOption({ id: editing.id, data, categoryId: category.id }, { onSuccess: closeForm })
    } else {
      createOption(
        { ...data, fee_category_id: category.id, academic_year_id: academicYearId },
        { onSuccess: closeForm },
      )
    }
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardContent className="p-4">
        {/* En-tête catégorie */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CircleDot className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">{category.name}</h3>
              <EntitlementsPopover
                categoryName={category.name}
                entitlements={category.entitlements}
                fallbackNote={category.description}
                className="-ml-2"
              />
              {category.description && (
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="h-5 border-border bg-muted text-[10px] text-muted-foreground">
              Optionnel
            </Badge>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEditCategory(category)} aria-label="Modifier la catégorie">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDeleteCategory(category)} aria-label="Supprimer la catégorie">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Options inline */}
        <div className="rounded-lg border border-border/60 bg-muted/30">
          {isLoading ? (
            <div className="space-y-1 p-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : options && options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt.id}
                className="group flex items-center gap-2 border-b border-border/50 px-3 py-2 last:border-0"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{opt.name}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {opt.amount.toLocaleString("fr-FR")}{" "}
                  <span className="text-[11px] font-normal text-muted-foreground">FCFA</span>
                </span>
                <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(opt)} aria-label={`Modifier ${opt.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteTarget(opt)} aria-label={`Supprimer ${opt.name}`}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            !showForm && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                Aucune option. Ajoutez-en une (ex : Menu complet, Demi-pension).
              </p>
            )
          )}

          {/* Formulaire inline create/edit */}
          {showForm && (
            <div className="border-t border-border/60 p-3">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-start gap-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="min-w-[140px] flex-1">
                        <FormControl>
                          <Input placeholder="Nom (ex : Menu complet)" className="h-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="w-[130px]">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Montant"
                            className="h-9"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-1">
                    <Button type="submit" size="icon" className="h-9 w-9" disabled={creating || updating} aria-label="Enregistrer">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={closeForm} aria-label="Annuler">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>

        {!showForm && (
          <Button size="sm" variant="ghost" className="mt-2 h-8 px-2 text-xs text-primary" onClick={openCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Ajouter une option
          </Button>
        )}
      </CardContent>

      {/* Confirmation suppression option */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer &quot;{deleteTarget?.name}&quot; ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette option ne sera plus proposée pour les futures inscriptions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget &&
                deleteOption(
                  { id: deleteTarget.id, categoryId: category.id },
                  { onSuccess: () => setDeleteTarget(null) },
                )
              }
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
