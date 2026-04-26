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
import { useCreatePayment } from "@/lib/hooks/usePayments"
import { PaymentCreateSchema, type PaymentCreate } from "@/lib/contracts/payment"

interface PaymentCreateModalProps {
  open: boolean
  onClose: () => void
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement bancaire",
  cheque: "Chèque",
}

export function PaymentCreateModal({ open, onClose }: PaymentCreateModalProps) {
  const form = useForm<PaymentCreate>({
    resolver: zodResolver(PaymentCreateSchema),
    defaultValues: { method: "cash", reference: null },
  })

  const { mutate, isPending } = useCreatePayment()

  function onSubmit(data: PaymentCreate) {
    mutate(data, {
      onSuccess: () => {
        form.reset({ method: "cash", reference: null })
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="enrollment_fee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frais d&apos;inscription *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="ID du frais d'inscription"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "") { field.onChange(undefined); return }
                        const num = Number(val)
                        if (!Number.isNaN(num) && num > 0) field.onChange(num)
                      }}
                    />
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
                      placeholder="Ex : 25000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Méthode de paiement *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Numéro de transaction (optionnel)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Enregistrement..." : "Enregistrer le paiement"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
