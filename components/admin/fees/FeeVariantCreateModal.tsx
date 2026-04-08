"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useCreateFeeVariant, useFeeCategories } from "@/lib/hooks/useFees"
import { useLevels } from "@/lib/hooks/useLevels"
import { useQueryClient } from "@tanstack/react-query"

const FormSchema = z.object({
  fee_category_id: z.number({ required_error: "La catégorie est requise" }).positive(),
  amount: z.number({ required_error: "Le montant est requis" }).positive("Le montant doit être positif"),
})

interface FeeVariantCreateModalProps {
  open: boolean
  onClose: () => void
  academicYearId: number
}

export function FeeVariantCreateModal({ open, onClose, academicYearId }: FeeVariantCreateModalProps) {
  const [selectedLevelIds, setSelectedLevelIds] = useState<Set<number>>(new Set())
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const { data: categories } = useFeeCategories()
  const mandatoryCategories = categories?.filter((c) => c.is_mandatory) ?? []
  const { data: levelsData } = useLevels()
  const levels = levelsData?.items ?? []
  const { mutateAsync } = useCreateFeeVariant()
  const queryClient = useQueryClient()

  function toggleLevel(levelId: number) {
    setSelectedLevelIds((prev) => {
      const next = new Set(prev)
      if (next.has(levelId)) next.delete(levelId)
      else next.add(levelId)
      return next
    })
  }

  function toggleAll() {
    if (selectedLevelIds.size === levels.length) {
      setSelectedLevelIds(new Set())
    } else {
      setSelectedLevelIds(new Set(levels.map((l) => l.id)))
    }
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (selectedLevelIds.size === 0) {
      toast.error("Sélectionnez au moins un niveau")
      return
    }

    setIsCreating(true)
    let success = 0
    let failed = 0

    for (const levelId of selectedLevelIds) {
      try {
        await mutateAsync({
          fee_category_id: data.fee_category_id,
          level_id: levelId,
          academic_year_id: academicYearId,
          amount: data.amount,
        })
        success++
      } catch {
        failed++
      }
    }

    setIsCreating(false)
    queryClient.invalidateQueries({ queryKey: ["fee-variants"] })

    if (success > 0) {
      toast.success(`${success} variante${success > 1 ? "s" : ""} créée${success > 1 ? "s" : ""}`)
    }
    if (failed > 0) {
      toast.error(`${failed} variante${failed > 1 ? "s" : ""} en erreur (doublon possible)`)
    }

    if (success > 0) {
      form.reset()
      setSelectedLevelIds(new Set())
      onClose()
    }
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
                  <FormLabel>Catégorie (obligatoire) *</FormLabel>
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

            {/* Multi-select niveaux */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Niveaux *</p>
              <div className="rounded-lg border p-3 space-y-2 max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 pb-2 border-b cursor-pointer">
                  <Checkbox
                    checked={levels.length > 0 && selectedLevelIds.size === levels.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">Tout sélectionner</span>
                </label>
                {levels.map((lvl) => (
                  <label key={lvl.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedLevelIds.has(lvl.id)}
                      onCheckedChange={() => toggleLevel(lvl.id)}
                    />
                    <span className="text-sm">{lvl.name}</span>
                  </label>
                ))}
              </div>
              {selectedLevelIds.size > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedLevelIds.size} niveau{selectedLevelIds.size > 1 ? "x" : ""} sélectionné{selectedLevelIds.size > 1 ? "s" : ""}
                </p>
              )}
            </div>

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
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : selectedLevelIds.size > 1 ? (
                `Créer ${selectedLevelIds.size} variantes`
              ) : (
                "Créer la variante"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
