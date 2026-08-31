"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { CreditCard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useStudentFees } from "@/lib/hooks/useStudents"
import {
  paymentKeys,
  useAllocationPreview,
  useRecordEnrollmentPayment,
} from "@/lib/hooks/usePayments"
import {
  EnrollmentPaymentCreateSchema,
  type EnrollmentPaymentCreate,
} from "@/lib/contracts/payment"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { PaymentAllocationSection } from "@/components/admin/payments/allocation/PaymentAllocationSection"
import { useAllocationDraft } from "@/components/admin/payments/allocation/useAllocationDraft"
import { PaymentDetailsFields } from "@/components/admin/payments/PaymentDetailsFields"

interface StudentPaymentModalProps {
  studentId: number
  open: boolean
  onClose: () => void
}

function formatFcfa(value: number): string {
  return `${Number(value).toLocaleString("fr-FR")} XOF`
}

export function StudentPaymentModal({ studentId, open, onClose }: StudentPaymentModalProps) {
  const queryClient = useQueryClient()
  const { data: fees, isLoading: feesLoading } = useStudentFees(studentId)

  // L'inscription courante = enrollment_id porté par les frais (déjà chargés).
  // Tous les frais d'une inscription pointent vers le même enrollment_id.
  const enrollmentId = useMemo(() => {
    const list = fees ?? []
    const firstWithRemaining = list.find((f) => f.remaining > 0)
    return firstWithRemaining?.enrollment_id ?? list[0]?.enrollment_id ?? null
  }, [fees])

  const totalRemaining = useMemo(
    () => (fees ?? []).reduce((acc, f) => acc + (f.remaining ?? 0), 0),
    [fees],
  )

  const form = useForm<EnrollmentPaymentCreate>({
    resolver: zodResolver(EnrollmentPaymentCreateSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      method: "cash",
      reference: null,
      notes: null,
    },
  })

  const watchedAmount = form.watch("amount")
  const debouncedAmount = useDebounce(watchedAmount, 350)

  const preview = useAllocationPreview(
    enrollmentId,
    typeof debouncedAmount === "number" && debouncedAmount > 0 ? debouncedAmount : null,
  )

  const { mutate, isPending } = useRecordEnrollmentPayment(enrollmentId ?? 0)

  const montant =
    typeof watchedAmount === "number" && Number.isFinite(watchedAmount) && watchedAmount > 0
      ? watchedAmount
      : 0
  const lignesApercu = useMemo(() => preview.data?.lines ?? [], [preview.data])
  const allocation = useAllocationDraft(lignesApercu, montant)
  const { setMode: setAllocationMode, clear: clearAllocations } = allocation

  // Reset le formulaire quand on rouvre la modal sur un autre élève
  useEffect(() => {
    if (!open) return
    form.reset({ amount: undefined as unknown as number, method: "cash", reference: null, notes: null })
    clearAllocations()
    setAllocationMode("auto")
  }, [open, studentId, form, clearAllocations, setAllocationMode])

  function onSubmit(data: EnrollmentPaymentCreate) {
    if (!enrollmentId) return
    if (allocation.blocked) return
    if (preview.data && !preview.data.can_record) {
      form.setError("amount", { message: preview.data.reject_reason ?? "Montant invalide" })
      return
    }
    mutate({ ...data, allocations: allocation.allocations }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: paymentKeys.all })
        queryClient.invalidateQueries({ queryKey: ["students", studentId] })
        queryClient.invalidateQueries({ queryKey: ["students", studentId, "fees"] })
        queryClient.invalidateQueries({ queryKey: ["enrollments"] })
        onClose()
      },
    })
  }

  const noFees = !feesLoading && (!fees || fees.length === 0)
  const allPaid = !feesLoading && totalRemaining <= 0
  const canSubmit =
    !!enrollmentId &&
    !noFees &&
    !allPaid &&
    (preview.data?.can_record ?? false) &&
    !allocation.blocked &&
    !isPending

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <CreditCard className="h-5 w-5 text-primary" />
            Nouveau versement
          </DialogTitle>
          <DialogDescription>
            Saisissez le montant. Par défaut il va aux frais impayés par priorité
            (Inscription, Trimestres, COGES, Tenue). Vous pouvez aussi le répartir
            vous-même, frais par frais.
          </DialogDescription>
        </DialogHeader>

        {feesLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : noFees ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun frais configuré pour cette inscription. Configurez d&apos;abord les frais
            scolaires avant d&apos;enregistrer un versement.
          </p>
        ) : allPaid ? (
          <p className="py-6 text-center text-sm text-emerald-700">
            Tous les frais sont soldés pour cette inscription.
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant versé (XOF) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Ex : 50 000"
                        min={1}
                        max={totalRemaining}
                        // Les flèches natives volent la moitié de la cible
                        // tactile sur un champ de montant.
                        className="h-12 text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        autoFocus
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Reste à payer : <strong>{formatFcfa(totalRemaining)}</strong>
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Répartition : automatique par défaut, manuelle sur demande */}
              {montant > 0 ? (
                <PaymentAllocationSection
                  amount={montant}
                  preview={preview.data}
                  isLoading={preview.isFetching && !preview.data}
                  error={preview.error as Error | null}
                  controller={allocation}
                />
              ) : null}

              <PaymentDetailsFields control={form.control} />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 sm:h-10"
                  onClick={onClose}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={!canSubmit} className="h-11 sm:h-10">
                  {isPending ? "Enregistrement…" : "Enregistrer le versement"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
