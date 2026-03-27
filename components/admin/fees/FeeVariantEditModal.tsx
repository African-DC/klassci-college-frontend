"use client"

import { useEffect } from "react"
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
import { FeeVariantCreateSchema, LEVELS, type FeeVariant, type FeeVariantUpdate } from "@/lib/contracts/fee"

interface FeeVariantEditModalProps {
  variant: FeeVariant | null
  onClose: () => void
}

export function FeeVariantEditModal({ variant, onClose }: FeeVariantEditModalProps) {
  const form = useForm<FeeVariantUpdate>({
    resolver: zodResolver(FeeVariantCreateSchema),
  })

  const { data: categories } = useFeeCategories()
  const { mutate, isPending } = useUpdateFeeVariant()

  // Pré-remplir le formulaire quand la variante change
  useEffect(() => {
    if (variant) {
      form.reset({
        category_id: variant.category_id,
        level: variant.level,
        amount: variant.amount,
        academic_year_id: variant.academic_year_id,
      })
    }
  }, [variant, form])

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
              name="category_id"
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
                      {categories?.map((c) => (
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
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau *</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
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
