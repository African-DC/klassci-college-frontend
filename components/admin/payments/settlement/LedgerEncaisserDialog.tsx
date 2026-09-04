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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PaymentAllocationSection } from "@/components/admin/payments/allocation/PaymentAllocationSection"
import { PaymentDetailsFields } from "@/components/admin/payments/PaymentDetailsFields"
import { useAllocationDraft } from "@/components/admin/payments/allocation/useAllocationDraft"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useAllocationPreview, useRecordEnrollmentPayment } from "@/lib/hooks/usePayments"
import { invalidateSettlementViews } from "@/lib/hooks/useFeeCategoryLedger"
import {
  EnrollmentPaymentCreateSchema,
  type EnrollmentPaymentCreate,
} from "@/lib/contracts/payment"
import type { LedgerRow } from "@/lib/contracts/fee-category-ledger"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} F`

/**
 * Encaisser depuis la ligne qu'on est en train de lire.
 *
 * L'écran conduisait jusqu'à « voici qui doit encore » et s'arrêtait là : le
 * seul débouché était un fichier, c'est-à-dire une sortie du produit. Le
 * comptable relevait un nom, ouvrait le journal, retrouvait l'élève, puis
 * l'inscription. Ici le geste part de la ligne.
 *
 * **L'inscription visée est celle de la ligne, jamais une devinette.** Le point
 * porte sur une année ; un élève en a souvent plusieurs. Retrouver
 * l'inscription à partir du seul élève — en prenant la première qui doit encore
 * — créditerait l'exercice précédent quand on lit celui-ci. `enrollment_id`
 * vient de la ligne, et il est exact.
 *
 * **La répartition reste au serveur.** Le montant est pré-rempli avec ce que
 * cette famille doit encore sur ce frais, quand on a le droit de le connaître ;
 * où cet argent va est décidé par l'aperçu, et affiché avant d'enregistrer.
 * Rejouer ici l'ordre de priorité mettrait la règle de l'argent en deux
 * exemplaires, et deux exemplaires finissent par diverger.
 */
export function LedgerEncaisserDialog({
  ligne,
  categorie,
  open,
  onClose,
}: {
  ligne: LedgerRow
  /** Le frais qu'on lisait : la fenêtre le nomme, sinon on ne sait plus d'où l'on vient. */
  categorie: string
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const allocation = useAllocationDraft()
  const { clear: clearAllocations, setMode: setAllocationMode } = allocation

  // `null` — et non zéro — quand l'appelant ne lit qu'une caisse : on ne sait
  // pas ce qui reste, donc on ne pré-remplit rien plutôt que de proposer un
  // montant qui passerait pour la dette.
  const restant = ligne.remaining

  const form = useForm<EnrollmentPaymentCreate>({
    resolver: zodResolver(EnrollmentPaymentCreateSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      method: "cash",
      reference: null,
      notes: null,
    },
  })

  // Rouvrir sur un autre élève ne doit jamais garder la saisie du précédent :
  // au guichet, c'est ainsi qu'un montant se pose sur la mauvaise famille.
  useEffect(() => {
    if (!open) return
    form.reset({
      amount: (restant && restant > 0 ? restant : undefined) as unknown as number,
      method: "cash",
      reference: null,
      notes: null,
    })
    clearAllocations()
    setAllocationMode("auto")
  }, [open, ligne.enrollment_id, restant, form, clearAllocations, setAllocationMode])

  const saisie = form.watch("amount")
  const montant = typeof saisie === "number" && Number.isFinite(saisie) && saisie > 0 ? saisie : 0

  // Montant et répartition partent ensemble, débouncés ensemble : les séparer
  // afficherait une ventilation calculée sur un montant déjà changé. La clé est
  // sérialisée pour que le debounce compare des valeurs, pas des identités.
  const requete = useMemo(
    () => JSON.stringify({ montant, allocations: allocation.allocations ?? null }),
    [montant, allocation.allocations],
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
    ligne.enrollment_id,
    demande.montant > 0 ? demande.montant : null,
    demande.allocations ?? undefined,
  )
  const apercuAJour = requeteStabilisee === requete

  const { mutate, isPending } = useRecordEnrollmentPayment(ligne.enrollment_id)

  const peutEnregistrer =
    montant > 0 && apercuAJour && (preview.data?.can_record ?? false) && !isPending

  function onSubmit(data: EnrollmentPaymentCreate) {
    // L'aperçu qui autorise l'envoi est celui de CETTE répartition. Le serveur
    // revérifie de toute façon, mais on ne lui envoie pas ce qu'il vient de
    // refuser.
    if (!peutEnregistrer) return
    mutate(
      { ...data, allocations: allocation.allocations },
      {
        onSuccess: () => {
          // Le versement change le point et la vue d'ensemble ; sans cela la
          // ligne resterait « Dû » sous les yeux de qui vient de l'encaisser.
          invalidateSettlementViews(queryClient)
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <CreditCard aria-hidden className="h-5 w-5 text-primary" />
            Encaisser
          </DialogTitle>
          <DialogDescription>
            Depuis le point sur « {categorie} ». Le montant va d&apos;abord aux frais dus par ordre
            de priorité ; vous pouvez le répartir vous-même, frais par frais.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Versement pour</p>
          <p className="font-medium">
            {ligne.last_name} {ligne.first_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {ligne.class_name || "Classe inconnue"}
            {ligne.student_matricule ? ` · ${ligne.student_matricule}` : ""}
          </p>
        </div>

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
                    {restant !== null
                      ? `Reste sur « ${categorie} » : ${fmt(restant)}. Le versement peut couvrir d'autres frais.`
                      : "Ce qui reste dû se lit sur tout l'argent reçu : depuis votre seule caisse, il est inconnu."}
                  </p>
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
                controller={allocation}
                disabled={isPending}
              />
            ) : null}

            <PaymentDetailsFields control={form.control} />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={!peutEnregistrer} className="h-11 sm:h-10">
                {isPending ? "Enregistrement…" : "Enregistrer le versement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
