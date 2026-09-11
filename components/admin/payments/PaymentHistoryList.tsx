"use client"

import { useState } from "react"
import { Receipt, Loader2, ArrowRight, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FEE_STATUS_LABEL } from "@/lib/contracts/payment"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionTitle } from "@/components/shared/PageHero"
import { useEnrollmentPayments } from "@/lib/hooks/usePayments"
import { paymentsApi } from "@/lib/api/payments"
import type { Payment } from "@/lib/contracts/payment"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { paymentMethodIcon } from "@/components/admin/payments/method-icon"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useReallocatePayment } from "@/lib/hooks/usePayments"
import {
  ReallocateAllocationDialog,
  type ReallocationTarget,
} from "@/components/admin/payments/ReallocateAllocationDialog"
import type { EnrollmentFeeItem } from "@/components/admin/payments/EnrollmentFeesBreakdown"

const fmt = (n: number) => `${Number(n).toLocaleString("fr-FR")} FCFA`

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  completed: { label: "Validé", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  pending: { label: "En attente", cls: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  cancelled: { label: "Annulé", cls: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  refunded: { label: "Remboursé", cls: "border-border bg-muted text-muted-foreground" },
  failed: { label: "Échoué", cls: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

/**
 * Historique des versements d'une inscription, avec la répartition (allocation)
 * de chaque versement sur les frais. Comble le vide : l'API renvoyait déjà les
 * allocations mais aucune vue ne les montrait. Chaque versement propose son reçu.
 */
export function PaymentHistoryList({
  enrollmentId,
  fees = [],
}: {
  enrollmentId: number
  /**
   * Les frais du dossier, pour dire ou une imputation peut etre deplacee.
   *
   * Passes par l'onglet plutot que relus ici : il les tient deja, et deux
   * lectures des memes frais finiraient par afficher deux restes dus.
   */
  fees?: EnrollmentFeeItem[]
}) {
  const { data: payments, isLoading } = useEnrollmentPayments(enrollmentId)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [aDeplacer, setADeplacer] = useState<ReallocationTarget | null>(null)
  const { has } = usePermissions()
  // Le meme droit que l'endpoint exige. La regle fine — sa propre caisse,
  // journee ouverte — reste au serveur, qui seul la connait ; son refus arrive
  // alors en toutes lettres plutot qu'en 403 muet.
  const peutCorriger = has("payments:create")
  const reimputation = useReallocatePayment(enrollmentId)

  async function openReceipt(payment: Payment) {
    setDownloading(payment.id)
    try {
      const blob = await paymentsApi.downloadReceipt(payment.id)
      window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer")
    } catch {
      toast.error("Impossible d'ouvrir le reçu")
    } finally {
      setDownloading(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="space-y-2 p-4 sm:p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    )
  }

  const list = payments ?? []

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <SectionTitle icon={Receipt}>Historique des versements</SectionTitle>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Receipt className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">Aucun versement enregistré pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {list.map((p) => {
              const MethodIcon = paymentMethodIcon(p.method)
              const st = STATUS_LABEL[p.status] ?? { label: p.status, cls: "border-border bg-muted text-muted-foreground" }
              const allocations = p.allocations ?? []
              return (
                <div key={p.id} className="rounded-xl border border-border/70 bg-muted/30 p-3.5">
                  {/* Ligne principale */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold tabular-nums">{fmt(p.amount)}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>{formatDate(p.created_at)}</span>
                        <span className="inline-flex items-center gap-1">
                          <MethodIcon className="h-3 w-3" />
                          {paymentMethodLabel(p.method)}
                        </span>
                        {p.reference && <span className="font-mono">{p.reference}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-primary"
                        onClick={() => openReceipt(p)}
                        disabled={downloading === p.id}
                      >
                        {downloading === p.id ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Receipt className="mr-1 h-3.5 w-3.5" />
                        )}
                        Reçu
                      </Button>
                    </div>
                  </div>

                  {/* Répartition sur les frais */}
                  {allocations.length > 0 && (
                    <div className="mt-2.5 space-y-1 border-t border-border/50 pt-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Réparti sur
                      </p>
                      {allocations.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-xs">
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{a.fee_category_name ?? "Frais"}</span>
                          {a.enrollment_fee_status_after && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                              {FEE_STATUS_LABEL[a.enrollment_fee_status_after]
                                ?? a.enrollment_fee_status_after}
                            </Badge>
                          )}
                          <span className="shrink-0 font-semibold tabular-nums text-primary">+ {fmt(a.amount)}</span>
                          {/* Le geste est pose sur la ligne meme, la ou l'erreur
                              se voit — et seulement sur un versement encaisse :
                              le serveur refuse les autres, et un bouton qui
                              repond 409 a tous les coups vaut moins que rien. */}
                          {peutCorriger && p.status === "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 shrink-0 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setADeplacer({
                                  paymentId: p.id,
                                  fromFeeId: a.enrollment_fee_id,
                                  fromFeeName: a.fee_category_name ?? "Frais",
                                  allocated: Number(a.amount),
                                })
                              }
                            >
                              <ArrowLeftRight aria-hidden className="mr-1 h-3 w-3" />
                              Réimputer
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <ReallocateAllocationDialog
        target={aDeplacer}
        fees={fees}
        busy={reimputation.isPending}
        onClose={() => setADeplacer(null)}
        onConfirm={({ toFeeId, amount, reason }) => {
          if (!aDeplacer) return
          reimputation.mutate(
            {
              id: aDeplacer.paymentId,
              from_enrollment_fee_id: aDeplacer.fromFeeId,
              to_enrollment_fee_id: toFeeId,
              amount,
              reason,
            },
            { onSuccess: () => setADeplacer(null) },
          )
        }}
      />
    </Card>
  )
}
