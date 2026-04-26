"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useStudentFees } from "@/lib/hooks/useStudents"
import { useCreatePayment, paymentKeys } from "@/lib/hooks/usePayments"

interface StudentPaymentModalProps {
  studentId: number
  open: boolean
  onClose: () => void
}

const StudentPaymentFormSchema = z.object({
  enrollment_fee_id: z.number({ required_error: "Veuillez sélectionner un frais" }).positive(),
  amount: z.string({ required_error: "Le montant est requis" }).refine(
    (val) => {
      const num = Number(val)
      return !Number.isNaN(num) && num > 0
    },
    { message: "Le montant doit être supérieur à 0" },
  ),
  method: z.enum(["cash", "mobile_money", "bank_transfer", "check"], {
    required_error: "Veuillez sélectionner un mode de paiement",
  }),
  reference: z.string().nullable().optional(),
})

type StudentPaymentFormValues = z.infer<typeof StudentPaymentFormSchema>

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement bancaire",
  check: "Chèque",
}

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

export function StudentPaymentModal({ studentId, open, onClose }: StudentPaymentModalProps) {
  const queryClient = useQueryClient()
  const { data: fees, isLoading: feesLoading } = useStudentFees(studentId)
  const { mutate, isPending } = useCreatePayment()

  const unpaidFees = (fees ?? []).filter((f) => f.remaining > 0)

  const form = useForm<StudentPaymentFormValues>({
    resolver: zodResolver(StudentPaymentFormSchema),
    defaultValues: {
      method: "cash",
      reference: null,
    },
  })

  const selectedFeeId = form.watch("enrollment_fee_id")
  const selectedFee = unpaidFees.find((f) => f.id === selectedFeeId)

  // When a fee is selected, set the amount to its remaining balance
  useEffect(() => {
    if (selectedFee) {
      form.setValue("amount", String(selectedFee.remaining))
    }
  }, [selectedFee, form])

  function onSubmit(data: StudentPaymentFormValues) {
    if (selectedFee && Number(data.amount) > selectedFee.remaining) {
      form.setError("amount", {
        message: `Le montant ne peut pas dépasser ${formatFCFA(selectedFee.remaining)}`,
      })
      return
    }

    mutate(
      {
        enrollment_fee_id: data.enrollment_fee_id,
        amount: data.amount,
        method: data.method,
        reference: data.reference ?? null,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: paymentKeys.all })
          queryClient.invalidateQueries({ queryKey: ["students", studentId] })
          queryClient.invalidateQueries({ queryKey: ["students", studentId, "fees"] })
          queryClient.invalidateQueries({ queryKey: ["enrollments"] })
          form.reset({ method: "cash", reference: null })
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
        </DialogHeader>

        {feesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : unpaidFees.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun frais en attente de paiement pour cet élève.
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="enrollment_fee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frais *</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un frais" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unpaidFees.map((fee) => (
                          <SelectItem key={fee.id} value={String(fee.id)}>
                            {fee.category_name} — {formatFCFA(fee.remaining)} restant
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
                        placeholder="Ex : 25000"
                        min={1}
                        max={selectedFee?.remaining}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    {selectedFee && (
                      <p className="text-xs text-muted-foreground">
                        Maximum : {formatFCFA(selectedFee.remaining)}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de paiement *</FormLabel>
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
        )}
      </DialogContent>
    </Dialog>
  )
}
