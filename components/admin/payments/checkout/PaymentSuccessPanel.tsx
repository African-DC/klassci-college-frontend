"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, Printer, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaymentReceiptDialog } from "@/components/admin/payments/PaymentReceiptDialog"
import { formatXof } from "@/components/admin/payments/allocation/format"
import { useValidateEnrollment } from "@/lib/hooks/useEnrollments"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useReceiptPreview } from "@/lib/hooks/useReceiptPreview"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { Payment } from "@/lib/contracts/payment"

interface PaymentSuccessPanelProps {
  payment: Payment
  studentName: string
  onDone: () => void
}

/**
 * Ce que la caissière voit une fois le versement écrit : le reçu à portée de
 * main, et la suite du dossier.
 *
 * Avant, le versement se refermait sur un simple message. Pour imprimer le
 * reçu, il fallait retrouver le versement dans la liste et le rouvrir : en
 * trente jours de rentrée, 1 049 consultations de versements pour 944
 * encaissements. Le reçu est désormais le premier bouton de l'écran.
 */
export function PaymentSuccessPanel({
  payment,
  studentName,
  onDone,
}: PaymentSuccessPanelProps) {
  const recu = useReceiptPreview()
  // Lu en base par le serveur, y compris quand il rend un versement déjà écrit.
  const resteApres = payment.enrollment_remaining_after ?? null
  const allocations = payment.allocations ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Versement enregistré</p>
          <p className="text-2xl font-bold tabular-nums">{formatXof(Number(payment.amount))}</p>
          <p className="truncate text-sm text-muted-foreground">
            {studentName} · {paymentMethodLabel(payment.method)}
          </p>
        </div>
      </div>

      {allocations.length > 0 ? (
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Réparti sur
          </p>
          <ul className="space-y-1.5 text-sm">
            {allocations.map((ligne) => (
              <li key={ligne.id} className="flex items-baseline justify-between gap-3">
                <span className="truncate">{ligne.fee_category_name ?? "Frais"}</span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatXof(Number(ligne.amount))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {resteApres !== null ? (
        <p className="text-sm">
          {resteApres > 0 ? (
            <>
              Reste à payer :{" "}
              <strong className="tabular-nums">{formatXof(resteApres)}</strong>
            </>
          ) : (
            <strong className="text-emerald-700 dark:text-emerald-400">Tout est réglé.</strong>
          )}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={() => recu.open(payment.id)}
        disabled={recu.loadingId === payment.id}
        className="h-12 w-full bg-accent text-accent-foreground shadow-sm hover:bg-accent/90"
      >
        {recu.loadingId === payment.id ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Printer className="mr-2 h-4 w-4" aria-hidden />
        )}
        Voir et imprimer le reçu
      </Button>

      {payment.enrollment_awaiting_validation ? (
        <ValidationStep enrollmentId={payment.enrollment_id} />
      ) : null}

      <Button type="button" variant="ghost" onClick={onDone} className="h-11 w-full">
        Terminer
      </Button>

      <PaymentReceiptDialog
        url={recu.url}
        paymentId={recu.paymentId}
        onClose={recu.close}
        onDownload={recu.download}
      />
    </div>
  )
}

/**
 * La validation, proposée une fois l'argent reçu, et seulement à qui en a le
 * droit. Les autres savent que la demande est partie, et à qui.
 */
function ValidationStep({ enrollmentId }: { enrollmentId: number | null | undefined }) {
  const { has, isLoading } = usePermissions()
  const valider = useValidateEnrollment()
  const [validee, setValidee] = useState(false)

  if (!enrollmentId || isLoading) return null

  if (validee) {
    return (
      <p className="flex items-center gap-2 rounded-lg border p-3 text-sm">
        <UserCheck className="h-4 w-4 text-emerald-600" aria-hidden />
        Inscription validée.
      </p>
    )
  }

  if (!has("enrollments:validate")) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        L&apos;inscription attend sa validation. La personne qui l&apos;a ouverte et celles qui
        peuvent la valider ont été prévenues, avec le montant reçu.
      </p>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={valider.isPending}
      onClick={() => valider.mutate(enrollmentId, { onSuccess: () => setValidee(true) })}
      className="h-11 w-full"
    >
      {valider.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <UserCheck className="mr-2 h-4 w-4" aria-hidden />
      )}
      Valider l&apos;inscription
    </Button>
  )
}
