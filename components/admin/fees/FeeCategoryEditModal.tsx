"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FeeEntitlementsField } from "@/components/admin/fees/FeeEntitlementsField"
import { useUpdateFeeCategory } from "@/lib/hooks/useFees"
import { FeeCategoryUpdateSchema, type FeeCategory, type FeeCategoryUpdate } from "@/lib/contracts/fee"

interface FeeCategoryEditModalProps {
  category: FeeCategory | null
  onClose: () => void
}

export function FeeCategoryEditModal({ category, onClose }: FeeCategoryEditModalProps) {
  const form = useForm<FeeCategoryUpdate>({
    resolver: zodResolver(FeeCategoryUpdateSchema),
    //  fait partie des valeurs même vide : le champ absent laisse
    // la contrepartie intacte côté backend, ce qui empêcherait de la vider ici.
    values: category
      ? {
          name: category.name,
          description: category.description,
          entitlements: category.entitlements ?? [],
        }
      : undefined,
  })

  const { mutate, isPending } = useUpdateFeeCategory()

  function onSubmit(data: FeeCategoryUpdate) {
    if (!category) return
    mutate(
      { id: category.id, data },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <Dialog open={!!category} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier la catégorie</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex : Scolarité, Inscription, COGES" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description optionnelle..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="entitlements"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FeeEntitlementsField value={field.value} onChange={field.onChange} />
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
