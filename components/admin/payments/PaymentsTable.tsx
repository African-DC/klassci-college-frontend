"use client"

import { UserCheck } from "lucide-react"
import { PaymentRowActions } from "@/components/admin/payments/PaymentRowActions"
import { StudentAvatar } from "@/components/admin/payments/StudentAvatar"
import { paymentRowView } from "@/components/admin/payments/paymentRowView"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Payment } from "@/lib/contracts/payment"

interface PaymentsTableProps {
  payments: Payment[]
  /** Le reçu en cours de téléchargement, pour n'immobiliser que sa ligne. */
  downloadingId: number | null
  onPreviewReceipt: (payment: Payment) => void
  onValidate: (payment: Payment) => void
  onCancel: (payment: Payment) => void
}

/**
 * Le journal des versements au format tableau, pour un écran large.
 *
 * Sa contrepartie `PaymentsCardList` montre les mêmes versements sur un
 * téléphone. Les deux dérivent ce qu'elles affichent du même
 * `paymentRowView`, faute de quoi elles finiraient par diverger.
 */
export function PaymentsTable({
  payments,
  downloadingId,
  onPreviewReceipt,
  onValidate,
  onCancel,
}: PaymentsTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Élève</TableHead>
            <TableHead>Frais</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Encaissé par</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const vue = paymentRowView(payment)
            return (
              <TableRow
                key={payment.id}
                className="group cursor-pointer"
                onClick={() => {
                  // Navigate to student detail if we have student info
                  // For now, open receipt preview
                  onPreviewReceipt(payment)
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <StudentAvatar
                      photoUrl={payment.student_photo_url}
                      initials={vue.initials}
                    />
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {payment.student_name ?? `Paiement #${payment.id}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">#{payment.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {payment.fee_name ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold tabular-nums">
                    {Number(payment.amount).toLocaleString("fr-FR")}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">FCFA</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <vue.MethodIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{vue.methodLabel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm">
                      {payment.received_by_name ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${vue.statusDot}`} />
                    <span className="text-sm">{vue.statusLabel}</span>
                  </div>
                  {vue.cancellation && (
                    <p className="mt-0.5 max-w-[22rem] text-xs text-muted-foreground">
                      {vue.cancellation}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">
                  {new Date(payment.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="opacity-60 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PaymentRowActions
                      payment={payment}
                      onValidate={onValidate}
                      onCancel={onCancel}
                      onPreviewReceipt={onPreviewReceipt}
                      previewBusy={downloadingId === payment.id}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
