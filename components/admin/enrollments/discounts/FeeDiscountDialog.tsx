"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BadgePercent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSetFeeDiscount } from "@/lib/hooks/useFeeDiscounts"
import {
  FeeDiscountUpsertSchema, calculateFeeDiscount,
  type FeeDiscount, type FeeDiscountUpsert,
} from "@/lib/contracts/fee-discount"
import type { EnrollmentFeeItem } from "@/components/admin/payments/EnrollmentFeesBreakdown"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`

export function FeeDiscountDialog({
  open, onClose, enrollmentId, studentId, fee, current,
}: {
  open: boolean
  onClose: () => void
  enrollmentId: number
  studentId: number
  fee: EnrollmentFeeItem
  current: FeeDiscount | null
}) {
  const save = useSetFeeDiscount(enrollmentId, studentId)
  const base = current?.original_amount ?? fee.amount
  const form = useForm<FeeDiscountUpsert>({
    resolver: zodResolver(FeeDiscountUpsertSchema),
    defaultValues: {
      kind: current?.kind ?? "fixed",
      value: current?.value ?? 0,
      reason: current?.reason ?? "",
    },
  })
  const kind = form.watch("kind")
  const value = form.watch("value")
  const preview = calculateFeeDiscount(base, { kind, value: Number(value) || 0, reason: "" })
  const isValidPreview = Number.isFinite(preview) && preview > 0 && preview <= base
  const remaining = Math.max(0, base - preview)
  const name = fee.option_name ?? fee.category_name

  const submit = form.handleSubmit((input) => {
    if (!isValidPreview) {
      form.setError("value", { message: "La réduction dépasse le tarif ou est nulle." })
      return
    }
    save.mutate({ feeId: fee.id, input }, { onSuccess: onClose })
  })

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !save.isPending) onClose() }}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgePercent className="h-5 w-5 text-primary" aria-hidden />
            {current ? "Modifier la réduction" : "Accorder une réduction"}
          </DialogTitle>
          <DialogDescription>
            {name} · Tarif initial {fmt(base)}. Cette décision concerne uniquement l'inscription affichée.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} className="space-y-4">
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de réduction</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); form.setValue("value", 0) }} value={field.value} disabled={save.isPending}>
                    <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">Montant en FCFA</SelectItem>
                      <SelectItem value="percent">Pourcentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{kind === "percent" ? "Pourcentage" : "Montant de la réduction (FCFA)"}</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="decimal" min="0" step="0.01" max={kind === "percent" ? 100 : base}
                      className="h-11" disabled={save.isPending}
                      value={field.value || ""}
                      onChange={(event) => field.onChange(Number(event.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif obligatoire</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} maxLength={500} disabled={save.isPending}
                      placeholder="Ex : réduction fratrie accordée par la direction" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2 rounded-xl border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Simulation avant validation</p>
              <div className="flex justify-between gap-3 text-sm">
                <span>Tarif initial</span><span className="font-medium tabular-nums">{fmt(base)}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span>Réduction</span>
                <span className="font-medium tabular-nums text-emerald-600">− {fmt(preview)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t pt-2">
                <span className="font-semibold">Nouveau montant dû</span>
                <span className="font-bold tabular-nums text-primary">{fmt(remaining)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Une réduction ne peut jamais être supérieure au tarif initial, ni créer un trop-perçu
              sur des versements déjà encaissés ou en attente. Le serveur le vérifie à l'enregistrement.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" className="h-11" onClick={onClose} disabled={save.isPending}>
                Retour
              </Button>
              <Button type="submit" className="h-11" disabled={save.isPending || !isValidPreview}>
                {save.isPending ? "Enregistrement..." : "Enregistrer la réduction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
