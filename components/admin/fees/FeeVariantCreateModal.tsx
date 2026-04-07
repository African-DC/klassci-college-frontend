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
import { useCreateFeeVariant, useFeeCategories } from "@/lib/hooks/useFees"
import { FeeVariantCreateSchema, type FeeVariantCreate } from "@/lib/contracts/fee"
import { useClasses } from "@/lib/hooks/useClasses"

interface FeeVariantCreateModalProps {
  open: boolean
  onClose: () => void
  academicYearId: number
}

export function FeeVariantCreateModal({ open, onClose, academicYearId }: FeeVariantCreateModalProps) {
  const form = useForm<FeeVariantCreate>({
    resolver: zodResolver(FeeVariantCreateSchema),
    defaultValues: { academic_year_id: academicYearId },
  })

  const { data: categories } = useFeeCategories()
  const { data: classesData } = useClasses()
  const classes = classesData?.items ?? []
  const { mutate, isPending } = useCreateFeeVariant()

  function onSubmit(data: FeeVariantCreate) {
    mutate(data, {
      onSuccess: () => {
        form.reset({ academic_year_id: academicYearId })
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle variante de frais</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fee_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorie *</FormLabel>
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner une categorie" />
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
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe *</FormLabel>
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner une classe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name}
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creation..." : "Creer la variante"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
