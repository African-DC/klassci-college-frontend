"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useFeeOptions, useCreateFeeOption, useUpdateFeeOption, useDeleteFeeOption } from "@/lib/hooks/useFees"
import { OptionalFeeOptionFormSchema, type FeeCategory, type OptionalFeeOption } from "@/lib/contracts/fee"

interface FeeOptionsDialogProps {
  category: FeeCategory | null
  academicYearId: number | undefined
  onClose: () => void
}

export function FeeOptionsDialog({ category, academicYearId, onClose }: FeeOptionsDialogProps) {
  const [editingOption, setEditingOption] = useState<OptionalFeeOption | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OptionalFeeOption | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: options, isLoading } = useFeeOptions(category?.id ?? 0)
  const { mutate: createOption, isPending: creating } = useCreateFeeOption()
  const { mutate: updateOption, isPending: updating } = useUpdateFeeOption()
  const { mutate: deleteOption, isPending: deleting } = useDeleteFeeOption()

  const form = useForm<z.infer<typeof OptionalFeeOptionFormSchema>>({
    resolver: zodResolver(OptionalFeeOptionFormSchema),
    defaultValues: { name: "", amount: undefined, description: null },
  })

  function openCreate() {
    setEditingOption(null)
    form.reset({ name: "", amount: undefined, description: null })
    setShowForm(true)
  }

  function openEdit(option: OptionalFeeOption) {
    setEditingOption(option)
    form.reset({ name: option.name, amount: option.amount, description: option.description })
    setShowForm(true)
  }

  function onSubmit(data: z.infer<typeof OptionalFeeOptionFormSchema>) {
    if (!category || !academicYearId) return

    if (editingOption) {
      updateOption(
        { id: editingOption.id, data, categoryId: category.id },
        {
          onSuccess: () => {
            setShowForm(false)
            setEditingOption(null)
          },
        }
      )
    } else {
      createOption(
        { ...data, fee_category_id: category.id, academic_year_id: academicYearId },
        {
          onSuccess: () => {
            setShowForm(false)
            form.reset()
          },
        }
      )
    }
  }

  function handleDelete() {
    if (!deleteTarget || !category) return
    deleteOption({ id: deleteTarget.id, categoryId: category.id }, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <>
      <Dialog open={!!category} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Options — {category?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Table des options */}
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : options && options.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="text-right">Montant (FCFA)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map((opt) => (
                    <TableRow key={opt.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{opt.name}</span>
                          {opt.description && (
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {opt.amount.toLocaleString("fr-FR")} FCFA
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(opt)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(opt)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !showForm ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune option. Ajoutez-en une pour cette catégorie.
              </p>
            ) : null}

            {/* Formulaire create/edit */}
            {showForm ? (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">
                  {editingOption ? `Modifier "${editingOption.name}"` : "Nouvelle option"}
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex : Menu complet" {...field} />
                            </FormControl>
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
                                placeholder="Ex : 50000"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={creating || updating}>
                        {creating || updating ? "Enregistrement..." : editingOption ? "Modifier" : "Ajouter"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowForm(false); setEditingOption(null) }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une option
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer &quot;{deleteTarget?.name}&quot; ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette option ne sera plus disponible pour les futures inscriptions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
