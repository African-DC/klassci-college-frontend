"use client"

import { useState, useMemo, useCallback } from "react"
import { Plus, CheckCircle, XCircle, Download, Wallet, TrendingUp, AlertCircle, Banknote } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCard } from "@/components/admin/dashboard/KpiCard"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaymentCreateModal } from "./PaymentCreateModal"
import { usePayments, useFinancialSummary, useValidatePayment, useCancelPayment } from "@/lib/hooks/usePayments"
import { paymentsApi } from "@/lib/api/payments"
import { downloadBlob } from "@/lib/utils"
import { PaymentStatusSchema } from "@/lib/contracts/payment"
import type { PaymentListParams, PaymentStatus, PaymentMethod, Payment } from "@/lib/contracts/payment"

const STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  en_attente: { label: "En attente", variant: "secondary" },
  valide: { label: "Validé", variant: "default" },
  annule: { label: "Annulé", variant: "destructive" },
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  virement: "Virement",
  cheque: "Chèque",
}

export function PaymentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>(undefined)
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | undefined>(undefined)
  const [confirmAction, setConfirmAction] = useState<{ type: "validate" | "cancel"; payment: Payment } | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const params: PaymentListParams = {
    ...(statusFilter && { status: statusFilter }),
    ...(methodFilter && { method: methodFilter }),
  }

  const { data, isLoading } = usePayments(params)
  const { data: summary, isLoading: loadingSummary } = useFinancialSummary()
  const { mutate: validatePayment, isPending: validating } = useValidatePayment()
  const { mutate: cancelPayment, isPending: cancelling } = useCancelPayment()

  const payments = useMemo(() => data?.data ?? [], [data])

  const handleDownloadReceipt = useCallback(async (payment: Payment) => {
    setDownloadingId(payment.id)
    try {
      const blob = await paymentsApi.downloadReceipt(payment.id)
      downloadBlob(blob, `recu-${payment.student_name}-${payment.id}.pdf`)
    } catch (err) {
      toast.error("Erreur lors du téléchargement", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setDownloadingId(null)
    }
  }, [])

  function handleConfirmAction() {
    if (!confirmAction) return
    const onSuccess = () => setConfirmAction(null)
    if (confirmAction.type === "validate") {
      validatePayment(confirmAction.payment.id, { onSuccess })
    } else {
      cancelPayment(confirmAction.payment.id, { onSuccess })
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Paiements</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des paiements et tableau de bord financier
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau paiement
        </Button>
      </div>

      {/* KPIs financiers */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            icon={Banknote}
            title="Attendu"
            value={`${summary.total_expected.toLocaleString("fr-FR")} FC`}
            variant="blue"
          />
          <KpiCard
            icon={Wallet}
            title="Collecté"
            value={`${summary.total_collected.toLocaleString("fr-FR")} FC`}
            variant="emerald"
          />
          <KpiCard
            icon={AlertCircle}
            title="Restant"
            value={`${summary.total_pending.toLocaleString("fr-FR")} FC`}
            variant="orange"
          />
          <KpiCard
            icon={TrendingUp}
            title="Taux de recouvrement"
            value={`${summary.collection_rate.toFixed(1)}%`}
            variant={summary.collection_rate >= 70 ? "emerald" : "orange"}
          />
        </div>
      ) : null}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? undefined : (v as PaymentStatus))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="valide">Validé</SelectItem>
            <SelectItem value="annule">Annulé</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={methodFilter ?? "all"}
          onValueChange={(v) => setMethodFilter(v === "all" ? undefined : (v as PaymentMethod))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Méthode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les méthodes</SelectItem>
            <SelectItem value="especes">Espèces</SelectItem>
            <SelectItem value="mobile_money">Mobile Money</SelectItem>
            <SelectItem value="virement">Virement</SelectItem>
            <SelectItem value="cheque">Chèque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des paiements */}
      {isLoading ? (
        <Skeleton className="h-80 rounded-lg" />
      ) : payments.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucun paiement trouvé.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: Payment) => {
                const statusCfg = STATUS_CONFIG[payment.status]
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.student_name}</TableCell>
                    <TableCell>{payment.class_name}</TableCell>
                    <TableCell>{payment.fee_category_name}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {payment.amount.toLocaleString("fr-FR")} FC
                    </TableCell>
                    <TableCell>{METHOD_LABELS[payment.method]}</TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(payment.paid_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {payment.status === PaymentStatusSchema.Values.en_attente && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setConfirmAction({ type: "validate", payment })}
                            >
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span className="sr-only">Valider le paiement de {payment.student_name}</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setConfirmAction({ type: "cancel", payment })}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Annuler le paiement de {payment.student_name}</span>
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownloadReceipt(payment)}
                          disabled={downloadingId === payment.id}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Télécharger le reçu de {payment.student_name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <div className="text-xs text-muted-foreground text-right">
          {data.total} paiement(s) — Page {data.page}/{data.total_pages}
        </div>
      )}

      <PaymentCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Dialog de confirmation pour valider/annuler un paiement */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "validate" ? "Valider ce paiement ?" : "Annuler ce paiement ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "validate"
                ? `Vous allez valider le paiement de ${confirmAction.payment.amount.toLocaleString("fr-FR")} FC pour ${confirmAction.payment.student_name}. Cette action est irréversible.`
                : `Vous allez annuler le paiement de ${confirmAction?.payment.amount.toLocaleString("fr-FR")} FC pour ${confirmAction?.payment.student_name}. Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={validating || cancelling}>
              {validating || cancelling
                ? "Traitement..."
                : confirmAction?.type === "validate" ? "Valider" : "Annuler le paiement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
