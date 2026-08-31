"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FeeEntitlementsField } from "@/components/admin/fees/FeeEntitlementsField"
import { useCreateFeeCategory } from "@/lib/hooks/useFees"
import { FeeCategoryCreateSchema, type FeeCategoryCreate } from "@/lib/contracts/fee"

interface FeeCategoryCreateModalProps {
  open: boolean
  onClose: () => void
}

export function FeeCategoryCreateModal({ open, onClose }: FeeCategoryCreateModalProps) {
  const form = useForm<FeeCategoryCreate>({
    resolver: zodResolver(FeeCategoryCreateSchema),
        defaultValues: { name: "", description: null, entitlements: [], is_mandatory: true, accepts_in_kind: false },
  })

  const { mutate, isPending } = useCreateFeeCategory()

  function onSubmit(data: FeeCategoryCreate) {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie de frais</DialogTitle>
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
                    <Input placeholder="Ex : Scolarité, Inscription, COGES" {...field} />
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
            <FormField
              control={form.control}
              name="is_mandatory"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Frais obligatoire</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Les frais obligatoires sont auto-assignés à l&apos;inscription (montants par niveau/série).
                      Les optionnels ont des options nommées (ex: menu cantine, arrêt transport).
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accepts_in_kind"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Accepte un dépôt en nature (ramette, chemise…)</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Si le parent dépose l&apos;article à l&apos;inscription, ce frais n&apos;est pas dû.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Création..." : "Créer la catégorie"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
