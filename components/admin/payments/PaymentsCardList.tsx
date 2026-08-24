"use client"

import { UserCheck } from "lucide-react"
import { PaymentCardActions } from "@/components/admin/payments/PaymentCardActions"
import { StudentAvatar } from "@/components/admin/payments/StudentAvatar"
import { paymentRowView } from "@/components/admin/payments/paymentRowView"
import type { Payment } from "@/lib/contracts/payment"

interface PaymentsCardListProps {
  payments: Payment[]
  onPreviewReceipt: (payment: Payment) => void
  onValidate: (payment: Payment) => void
  onCancel: (payment: Payment) => void
}

/**
 * Le journal des versements en cartes, pour un téléphone.
 *
 * Ce n'est pas le tableau rétréci : le montant passe en premier, comme sur
 * les applications d'argent mobile que la caissière utilise déjà, parce
 * qu'au guichet c'est le chiffre qu'on cherche d'abord. Les valeurs
 * affichées viennent du même `paymentRowView` que le tableau.
 */
export function PaymentsCardList({
  payments,
  onPreviewReceipt,
  onValidate,
  onCancel,
}: PaymentsCardListProps) {
  return (
    <div className="space-y-2 p-3 md:hidden">
      {payments.map((payment) => {
        const vue = paymentRowView(payment)
        return (
          <div
            key={payment.id}
            className="overflow-hidden rounded-lg border bg-card"
          >
            <button
              type="button"
              onClick={() => onPreviewReceipt(payment)}
              className="w-full p-3 text-left transition-colors hover:bg-accent/40 active:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="flex items-start gap-3">
                <StudentAvatar photoUrl={payment.student_photo_url} initials={vue.initials} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium leading-tight">
                      {payment.student_name ?? `Paiement #${payment.id}`}
                    </p>
                    <p className="shrink-0 text-base font-semibold tabular-nums leading-tight">
                      {Number(payment.amount).toLocaleString("fr-FR")}
                      <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">FCFA</span>
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <vue.MethodIcon className="h-3 w-3" aria-hidden="true" />
                      {vue.methodLabel}
                    </span>
                    <span className="tabular-nums">
                      {new Date(payment.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${vue.statusDot}`} aria-hidden="true" />
                      <span className="font-medium">{vue.statusLabel}</span>
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                    <UserCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                    Encaissé par {payment.received_by_name ?? "—"}
                  </p>
                  {payment.fee_name && (
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {payment.fee_name}
                    </p>
                  )}
                  {vue.cancellation && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {vue.cancellation}
                    </p>
                  )}
                </div>
              </div>
            </button>
            <PaymentCardActions
              payment={payment}
              onValidate={onValidate}
              onCancel={onCancel}
            />
          </div>
        )
      })}
    </div>
  )
}
