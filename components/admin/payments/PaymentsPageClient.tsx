"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus, Download, Wallet, TrendingUp,
  AlertCircle, Banknote, CreditCard, Eye,
  Receipt, FileSpreadsheet, Loader2, UserCheck,
} from "lucide-react"
import { toast } from "sonner"
import { PaymentRowActions } from "@/components/admin/payments/PaymentRowActions"
import { PaymentCardActions } from "@/components/admin/payments/PaymentCardActions"
import { StudentAvatar } from "@/components/admin/payments/StudentAvatar"
import { PaymentsFilters } from "@/components/admin/payments/PaymentsFilters"
import { usePaymentFilters } from "@/lib/hooks/usePaymentFilters"
import { PaymentConfirmDialog, type PaymentConfirmAction } from "@/components/admin/payments/PaymentConfirmDialog"
import { PaymentReceiptDialog } from "@/components/admin/payments/PaymentReceiptDialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero, heroAccentBtn, heroGlassBtn, type HeroKpi } from "@/components/shared/PageHero"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaymentCreateWizard } from "./PaymentCreateWizard"
import {
  usePayments,
  useFinancialSummary,
  useValidatePayment,
  useCancelPayment,
  useCashiers,
} from "@/lib/hooks/usePayments"
import { useFeeCategories } from "@/lib/hooks/useFees"
import { paymentsApi } from "@/lib/api/payments"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { paymentMethodIcon } from "@/components/admin/payments/method-icon"
import { openPdfPreview } from "@/lib/pdf/preview"
import { downloadBlob } from "@/lib/utils"
import type { PaymentStatus, Payment } from "@/lib/contracts/payment"

/** « Annulé le 23/08/2026 par M. Konan · motif » — la ligne d'un contrôle. */
function motifComplet(p: Payment): string {
  const quand = p.cancelled_at
    ? ` le ${new Date(p.cancelled_at).toLocaleDateString("fr-FR")}`
    : ""
  const qui = p.cancelled_by_name ? ` par ${p.cancelled_by_name}` : ""
  return `Annulé${quand}${qui}${p.cancellation_reason ? ` · ${p.cancellation_reason}` : ""}`
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; dot: string }> = {
  pending: { label: "En attente", dot: "bg-amber-500" },
  completed: { label: "Validé", dot: "bg-emerald-500" },
  failed: { label: "Échoué", dot: "bg-red-500" },
  refunded: { label: "Remboursé", dot: "bg-blue-500" },
  cancelled: { label: "Annulé", dot: "bg-rose-500" },
}

export function PaymentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<PaymentConfirmAction | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewPaymentId, setPreviewPaymentId] = useState<number | null>(null)
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | "preview" | null>(null)

  const { filters, set, reset, params, activeCount } = usePaymentFilters()

  const { data, isLoading } = usePayments(params)
  const { data: summary } = useFinancialSummary()
  const { mutate: validatePayment, isPending: validating } = useValidatePayment()
  const { mutate: cancelPayment, isPending: cancelling } = useCancelPayment()
  const { data: feeCategories } = useFeeCategories()
  const { data: cashiers } = useCashiers()

  const payments = useMemo(() => data?.items ?? [], [data])

  // Le filtre « Encaissé par » n'a de sens qu'avec plusieurs guichets à
  // distinguer. Un caissier cloisonné ne reçoit que lui-même du serveur : lui
  // proposer une liste d'un seul nom serait un faux choix.
  const showCashierFilter = (cashiers?.length ?? 0) > 1

  // Les exports sont produits par le serveur, aux mêmes filtres que l'écran et
  // sous le même cloisonnement : un caissier n'obtient jamais dans un fichier
  // ce que son tableau ne lui montre pas.
  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format)
    try {
      const blob = await paymentsApi.downloadJournal(params, format)
      const jour = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `journal-versements-${jour}.${format}`)
      toast.success(format === "pdf" ? "Journal PDF téléchargé" : "Journal Excel téléchargé")
    } catch (err) {
      toast.error("Export impossible", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setExporting(null)
    }
  }

  async function handleExportPreview() {
    setExporting("preview")
    try {
      await openPdfPreview(() => paymentsApi.downloadJournal(params, "pdf"))
    } finally {
      setExporting(null)
    }
  }

  const handlePreviewReceipt = useCallback(async (payment: Payment) => {
    setDownloadingId(payment.id)
    try {
      const blob = await paymentsApi.downloadReceipt(payment.id)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPreviewPaymentId(payment.id)
    } catch (err) {
      toast.error("Erreur lors du chargement du reçu", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setDownloadingId(null)
    }
  }, [])

  function handleClosePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewPaymentId(null)
  }

  function handleDownloadFromPreview() {
    if (previewUrl && previewPaymentId) {
      const a = document.createElement("a")
      a.href = previewUrl
      a.download = `recu-${previewPaymentId}.pdf`
      a.click()
    }
  }

  function handleConfirmAction(reason: string) {
    if (!confirmAction) return
    const onSuccess = () => setConfirmAction(null)
    if (confirmAction.type === "validate") {
      validatePayment(confirmAction.payment.id, { onSuccess })
    } else {
      cancelPayment({ id: confirmAction.payment.id, reason }, { onSuccess })
    }
  }

  // Le serveur ne sert pas le recouvrement a qui ne lit que sa propre caisse.
  // Son absence est donc le signal, et il n'y en a pas d'autre a inventer.
  const cloisonne = summary?.total_expected === null

  const heroKpis: HeroKpi[] | undefined = summary
    ? [
        {
          label: "Attendu",
          // Une caissiere ne lit pas le recouvrement de l'etablissement : le
          // tiret dit « pas de votre ressort », la ou un 0 F dirait « rien
          // n'est du ».
          value: cloisonne ? "—" : `${summary.total_expected!.toLocaleString("fr-FR")} F`,
          icon: Banknote,
        },
        {
          label: cloisonne ? "Encaissé par vous" : "Collecté",
          value: `${summary.total_paid.toLocaleString("fr-FR")} F`,
          icon: Wallet,
          hint: `${summary.payment_count} paiement(s)`,
        },
        {
          label: "En attente",
          value: `${summary.total_pending.toLocaleString("fr-FR")} F`,
          icon: AlertCircle,
        },
        {
          label: "Taux de recouvrement",
          value: cloisonne ? "—" : `${summary.completion_rate!.toFixed(1)}%`,
          icon: TrendingUp,
          hint:
            summary.total_cancelled > 0
              ? `${summary.total_cancelled.toLocaleString("fr-FR")} FCFA annulés`
              : undefined,
        },
      ]
    : undefined

  return (
    <div className="space-y-6">
      {/* Hero signature KLASSCI (dégradé bleu + KPIs financiers intégrés) */}
      <PageHero
        icon={CreditCard}
        title="Paiements"
        subtitle="Suivi des paiements et tableau de bord financier"
        actions={
          <>
            <button
              type="button"
              className={`${heroGlassBtn} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => handleExport("xlsx")}
              disabled={exporting !== null || payments.length === 0}
              aria-label="Télécharger le journal des versements au format Excel"
            >
              {exporting === "xlsx" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              )}
              Excel
            </button>
            <button
              type="button"
              className={`${heroGlassBtn} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={handleExportPreview}
              disabled={exporting !== null || payments.length === 0}
              aria-label="Aperçu avant impression du journal des versements"
            >
              {exporting === "preview" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
              Aperçu
            </button>
            <button
              type="button"
              className={`${heroGlassBtn} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null || payments.length === 0}
              aria-label="Télécharger le journal des versements au format PDF"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              PDF
            </button>
            <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouveau paiement
            </button>
          </>
        }
        kpis={heroKpis}
      />

      <PaymentsFilters
        filters={filters}
        set={set}
        reset={reset}
        activeCount={activeCount}
        feeCategories={feeCategories}
        cashiers={cashiers}
        showCashier={showCashierFilter}
      />

      {/* Tableau des paiements premium */}
      <Card className="border-0 shadow-sm ring-1 ring-border overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Receipt className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Aucun paiement trouvé</p>
              <p className="text-xs mt-1">
                {activeCount > 0 || filters.search
                  ? "Essayez de modifier vos filtres"
                  : "Créez votre premier paiement"}
              </p>
            </div>
          ) : (
            <>
            {/* Desktop : table dense. Mobile : cards persona-first */}
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
                {payments.map((payment: Payment) => {
                  const statusCfg = STATUS_CONFIG[payment.status]
                  const MethodIcon = paymentMethodIcon(payment.method)
                  const initials = payment.student_name
                    ? payment.student_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                    : "?"
                  return (
                    <TableRow
                      key={payment.id}
                      className="group cursor-pointer"
                      onClick={() => {
                        // Navigate to student detail if we have student info
                        // For now, open receipt preview
                        handlePreviewReceipt(payment)
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <StudentAvatar
                            photoUrl={payment.student_photo_url}
                            initials={initials}
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
                          <MethodIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{paymentMethodLabel(payment.method)}</span>
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
                          <div className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
                          <span className="text-sm">{statusCfg.label}</span>
                        </div>
                        {payment.cancellation_reason && (
                          <p className="mt-0.5 max-w-[22rem] text-xs text-muted-foreground">
                            {motifComplet(payment)}
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
                            onValidate={(p) => setConfirmAction({ type: "validate", payment: p })}
                            onCancel={(p) => setConfirmAction({ type: "cancel", payment: p })}
                            onPreviewReceipt={handlePreviewReceipt}
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

            {/* Mobile : cards verticales, Wave-style amount-first + status colored */}
            <div className="space-y-2 p-3 md:hidden">
              {payments.map((payment: Payment) => {
                const statusCfg = STATUS_CONFIG[payment.status]
                const MethodIcon = paymentMethodIcon(payment.method)
                const initials = payment.student_name
                  ? payment.student_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                  : "?"
                return (
                  <div
                    key={payment.id}
                    className="overflow-hidden rounded-lg border bg-card"
                  >
                    <button
                      type="button"
                      onClick={() => handlePreviewReceipt(payment)}
                      className="w-full p-3 text-left transition-colors hover:bg-accent/40 active:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="flex items-start gap-3">
                        <StudentAvatar photoUrl={payment.student_photo_url} initials={initials} />
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
                              <MethodIcon className="h-3 w-3" aria-hidden="true" />
                              {paymentMethodLabel(payment.method)}
                            </span>
                            <span className="tabular-nums">
                              {new Date(payment.created_at).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                            <span className="ml-auto inline-flex items-center gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} aria-hidden="true" />
                              <span className="font-medium">{statusCfg.label}</span>
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
                          {payment.cancellation_reason && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {motifComplet(payment)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    <PaymentCardActions
                      payment={payment}
                      onValidate={(p) => setConfirmAction({ type: "validate", payment: p })}
                      onCancel={(p) => setConfirmAction({ type: "cancel", payment: p })}
                    />
                  </div>
                )
              })}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination info */}
      {data && payments.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          {data.total} paiement(s) — Page {data.page}/{data.size > 0 ? Math.ceil(data.total / data.size) : 1}
        </div>
      )}

      <PaymentCreateWizard open={createOpen} onClose={() => setCreateOpen(false)} />

      <PaymentConfirmDialog
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        busy={validating || cancelling}
      />

      <PaymentReceiptDialog
        url={previewUrl}
        paymentId={previewPaymentId}
        onClose={handleClosePreview}
        onDownload={handleDownloadFromPreview}
      />
    </div>
  )
}
