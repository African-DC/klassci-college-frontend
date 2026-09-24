"use client"

import { useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useDebounce } from "@/lib/hooks/useDebounce"
import {
  useAllocationPreview,
  useRecordEnrollmentPayment,
} from "@/lib/hooks/usePayments"
import {
  EnrollmentPaymentCreateSchema,
  type EnrollmentPaymentCreate,
} from "@/lib/contracts/payment"
import { PaymentDetailsFields } from "@/components/admin/payments/PaymentDetailsFields"
import { PaymentAllocationSection } from "@/components/admin/payments/allocation/PaymentAllocationSection"
import { useAllocationDraft } from "@/components/admin/payments/allocation/useAllocationDraft"
import { formatXof } from "@/components/admin/payments/allocation/format"
import type { Payment } from "@/lib/contracts/payment"
import { newSubmissionKey } from "@/lib/utils/submission-key"

interface StepRecordPaymentProps {
  enrollmentId: number
  studentName: string
  /** « 6e B · 2025-2026 » : de quoi reconnaître l'inscription d'un coup d'œil. */
  contexte: string
  /** Rend le versement écrit ; son reste à payer est calculé par le serveur. */
  onSuccess: (payment: Payment) => void
}

/**
 * La saisie du versement, montant d'abord.
 *
 * L'encaisseur tape ce que la famille lui tend, puis, seulement s'il le veut,
 * décide où va cet argent. Sans ce geste, le serveur répartit comme il l'a
 * toujours fait : le cas courant n'a pas gagné une seule friction.
 */
export function StepRecordPayment({
  enrollmentId,
  studentName,
  contexte,
  onSuccess,
}: StepRecordPaymentProps) {
  const form = useForm<EnrollmentPaymentCreate>({
    resolver: zodResolver(EnrollmentPaymentCreateSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      method: "cash",
      reference: null,
      notes: null,
    },
  })

  const saisie = form.watch("amount")
  const montant = typeof saisie === "number" && Number.isFinite(saisie) && saisie > 0 ? saisie : 0
  const controller = useAllocationDraft()

  // Le montant et la répartition partent ensemble, débouncés ensemble. Les
  // séparer afficherait une ventilation calculée sur un montant que
  // l'encaisseur a déjà changé. La clé est sérialisée pour que le debounce
  // compare des valeurs et non des identités de tableau.
  const requete = useMemo(
    () => JSON.stringify({ montant, allocations: controller.allocations ?? null }),
    [montant, controller.allocations],
  )
  const requeteStabilisee = useDebounce(requete, 350)
  const demande = useMemo(
    () =>
      JSON.parse(requeteStabilisee) as {
        montant: number
        allocations: EnrollmentPaymentCreate["allocations"] | null
      },
    [requeteStabilisee],
  )

  const preview = useAllocationPreview(
    enrollmentId,
    demande.montant > 0 ? demande.montant : null,
    demande.allocations ?? undefined,
  )

  const { mutate, isPending } = useRecordEnrollmentPayment(enrollmentId)

  // Une clé par saisie : tant que rien ne change, un second appui renvoie la
  // même, et le serveur rend le versement déjà écrit au lieu d'un doublon.
  const method = form.watch("method")
  const reference = form.watch("reference")
  const signature = JSON.stringify({ montant, method, reference, a: controller.allocations ?? null })
  // Dans un ref et non un `useMemo` : React peut recalculer un memo à sa
  // guise, et une clé neuve sur un renvoi, c'est un second versement.
  const cleRef = useRef<{ signature: string; cle: string } | null>(null)
  function cleDEnvoi(): string {
    if (cleRef.current?.signature !== signature) {
      cleRef.current = { signature, cle: newSubmissionKey() }
    }
    return cleRef.current.cle
  }

  const apercuAJour = requeteStabilisee === requete
  const resteAPayer = preview.data?.total_remaining_before

  const canSubmit =
    montant > 0 &&
    apercuAJour &&
    (preview.data?.can_record ?? false) &&
    !isPending

  function onSubmit(data: EnrollmentPaymentCreate) {
    // L'aperçu qui autorise l'envoi est celui de CETTE répartition : le serveur
    // revérifiera de toute façon, mais on ne lui envoie pas sciemment ce qu'il
    // vient de refuser.
    if (!canSubmit) return
    let cle: string
    try {
      cle = cleDEnvoi()
    } catch (err) {
      toast.error("Impossible d'enregistrer depuis ce navigateur", {
        description: err instanceof Error ? err.message : "Réessayez depuis un autre navigateur.",
      })
      return
    }
    mutate({ ...data, allocations: controller.allocations, idempotency_key: cle }, { onSuccess })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Versement pour</p>
          <p className="font-medium">{studentName}</p>
          <p className="text-xs text-muted-foreground">{contexte}</p>
        </div>

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
                  min={1}
                  step={1}
                  autoFocus
                  placeholder="Ex : 50000"
                  className="h-12 text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? undefined : Number(event.target.value),
                    )
                  }
                />
              </FormControl>
              {resteAPayer !== undefined ? (
                <p className="text-xs text-muted-foreground">
                  Reste à payer sur cette inscription :{" "}
                  <strong className="text-foreground">{formatXof(resteAPayer)}</strong>
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

        {montant > 0 ? (
          <PaymentAllocationSection
            amount={montant}
            preview={preview.data}
            isLoading={preview.isFetching && !preview.data}
            error={preview.error as Error | null}
            controller={controller}
            disabled={isPending}
          />
        ) : null}

        <PaymentDetailsFields control={form.control} />

        <Button type="submit" disabled={!canSubmit} className="h-12 w-full sm:h-11">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : montant > 0 ? (
            `Enregistrer ${formatXof(montant)}`
          ) : (
            "Enregistrer le versement"
          )}
        </Button>
      </form>
    </Form>
  )
}
