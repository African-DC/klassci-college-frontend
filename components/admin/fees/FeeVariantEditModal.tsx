"use client"

import { useForm } from "react-hook-form"
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
}

export function FeeVariantEditModal({ variant, onClose }: FeeVariantEditModalProps) {
  const form = useForm<FeeVariantUpdate>({
    resolver: zodResolver(FeeVariantUpdateSchema),
    values: variant ? {
      fee_category_id: variant.fee_category_id,
      level_id: variant.level_id,
      series_id: variant.series_id,
      amount: variant.amount,
      academic_year_id: variant.academic_year_id,
    } : undefined,
  })

  const { data: categories } = useFeeCategories()
  const mandatoryCategories = categories?.filter((c) => c.is_mandatory) ?? []
  const { data: levelsData } = useLevels()
  const levels = levelsData?.items ?? []
  const { mutate, isPending } = useUpdateFeeVariant()

  function onSubmit(data: FeeVariantUpdate) {
    if (!variant) return
    mutate(
      { id: variant.id, data },
      { onSuccess: () => onClose() },
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
                      {mandatoryCategories.map((c) => (
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant (FC) *</FormLabel>
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
