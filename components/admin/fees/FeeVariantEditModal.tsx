"use client"

import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { ASSIGNMENT_SCOPES } from "@/lib/contracts/fee"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useUpdateFeeVariant, useFeeCategories } from "@/lib/hooks/useFees"
import { FeeVariantUpdateSchema, type FeeVariant, type FeeVariantUpdate } from "@/lib/contracts/fee"
import { useLevels } from "@/lib/hooks/useLevels"

interface FeeVariantEditModalProps {
  variant: FeeVariant | null
  onClose: () => void
  /**
   * Appelé quand l'enregistrement a bel et bien changé le montant.
   *
   * C'est l'instant où la question se pose : l'école vient de corriger un
   * tarif, et les élèves déjà inscrits gardent l'ancien. Ne rien demander
   * ici laisserait l'écart s'installer sans que personne ne le voie.
   */
  onAmountChanged?: (updated: FeeVariant) => void
}

export function FeeVariantEditModal({
  variant,
  onClose,
  onAmountChanged,
}: FeeVariantEditModalProps) {
  const form = useForm<FeeVariantUpdate>({
    resolver: zodResolver(FeeVariantUpdateSchema),
    values: variant ? {
      fee_category_id: variant.fee_category_id,
      level_id: variant.level_id,
      series_id: variant.series_id,
      assignment_scope: variant.assignment_scope ?? null,
      amount: variant.amount,
      academic_year_id: variant.academic_year_id,
    } : undefined,
  })

  const { data: categories } = useFeeCategories()
  // Liste des catégories sélectionnables : les obligatoires + la catégorie
  // courante de la variante si elle n'y figure pas (sinon le Select ne peut
  // pas afficher la valeur pré-remplie et paraît vide à l'ouverture).
  const selectableCategories = useMemo(() => {
    const mandatory = categories?.filter((c) => c.is_mandatory) ?? []
    if (variant && !mandatory.some((c) => c.id === variant.fee_category_id)) {
      const current = categories?.find((c) => c.id === variant.fee_category_id)
      if (current) return [current, ...mandatory]
    }
    return mandatory
  }, [categories, variant])
  const { data: levelsData } = useLevels()
  const levels = levelsData?.items ?? []
  const { mutate, isPending } = useUpdateFeeVariant()

  function onSubmit(data: FeeVariantUpdate) {
    if (!variant) return
    const ancienMontant = variant.amount
    mutate(
      { id: variant.id, data },
      {
        onSuccess: (updated) => {
          onClose()
          // Seulement si le montant a bougé : ouvrir la question après une
          // simple correction de portée ferait du bruit pour rien.
          if (updated.amount !== ancienMontant) onAmountChanged?.(updated)
        },
      },
    )
  }

  return (
    <Dialog open={!!variant} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier la variante</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fee_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie *</FormLabel>
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectableCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau *</FormLabel>
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {levels.map((lvl) => (
                        <SelectItem key={lvl.id} value={lvl.id.toString()}>
                          {lvl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignment_scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>À qui s&apos;applique ce montant</FormLabel>
                  <Select
                    value={field.value ?? "tous"}
                    onValueChange={(v) => field.onChange(v === "tous" ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSIGNMENT_SCOPES.map((scope) => (
                        <SelectItem key={scope.value ?? "tous"} value={scope.value ?? "tous"}>
                          {scope.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant (FCFA) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex : 45000"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
