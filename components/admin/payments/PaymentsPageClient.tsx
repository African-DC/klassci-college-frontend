"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus, Download, Wallet, TrendingUp,
  AlertCircle, Banknote, CreditCard, Eye,
  Receipt, FileSpreadsheet, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { PaymentsFilters } from "@/components/admin/payments/PaymentsFilters"
import { usePaymentFilters } from "@/lib/hooks/usePaymentFilters"
import { useScrollSentinel } from "@/lib/hooks/useScrollSentinel"
import { PaymentConfirmDialog, type PaymentConfirmAction } from "@/components/admin/payments/PaymentConfirmDialog"
import { PaymentReceiptDialog } from "@/components/admin/payments/PaymentReceiptDialog"
import { PaymentsTable } from "@/components/admin/payments/PaymentsTable"
import { PaymentsCardList } from "@/components/admin/payments/PaymentsCardList"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero, heroAccentBtn, heroGlassBtn, type HeroKpi } from "@/components/shared/PageHero"
import { PaymentCreateWizard } from "./PaymentCreateWizard"
import {
  useInfinitePayments,
  useFinancialSummary,
  useValidatePayment,
  useCancelPayment,
  useCashiers,
} from "@/lib/hooks/usePayments"
import { useFeeCategories } from "@/lib/hooks/useFees"
import { paymentsApi } from "@/lib/api/payments"
import { openPdfPreview } from "@/lib/pdf/preview"
import { downloadBlob } from "@/lib/utils"
import type { Payment } from "@/lib/contracts/payment"

export function PaymentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<PaymentConfirmAction | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewPaymentId, setPreviewPaymentId] = useState<number | null>(null)
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | "preview" | null>(null)

  const { filters, set, reset, params, activeCount } = usePaymentFilters()

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePayments(params)
  // Le bandeau recoit les memes criteres que la liste : sinon il annonce
  // l'annee entiere au-dessus de trois lignes filtrees.
  const { data: summary } = useFinancialSummary(undefined, params)
  const { mutate: validatePayment, isPending: validating } = useValidatePayment()
  const { mutate: cancelPayment, isPending: cancelling } = useCancelPayment()
  const { data: feeCategories } = useFeeCategories()
  const { data: cashiers } = useCashiers()

  // Les pages chargees, mises bout a bout.
  const payments = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  )
  const total = data?.pages[0]?.total ?? 0

  const sentinelle = useScrollSentinel({
    actif: Boolean(hasNextPage) && !isFetchingNextPage,
    onApproche: () => void fetchNextPage(),
  })

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

  // Un filtre actif change le sens de la moitie des chiffres. Le dire sur
  // chaque carte evite de lire « 3 versements » en ayant oublie un filtre
  // pose dix minutes plus tot, et de croire que la caisse est vide.
  const filtre = activeCount > 0 || Boolean(filters.search)
  const surLeFiltre = filtre ? "sur le filtre actif" : undefined
  const horsFiltre = filtre ? "toute l'année, hors filtre" : undefined
  const avec = (base: string | undefined, mention: string | undefined) =>
    [base, mention].filter(Boolean).join(" · ") || undefined

  const heroKpis: HeroKpi[] | undefined = summary
    ? [
        {
          label: "Attendu",
          // Une caissiere ne lit pas le recouvrement de l'etablissement : le
          // tiret dit « pas de votre ressort », la ou un 0 F dirait « rien
          // n'est du ».
          value: cloisonne ? "—" : `${summary.total_expected!.toLocaleString("fr-FR")} F`,
          icon: Banknote,
          // Le recouvrement parle de la dette de l'ecole, pas des lignes
          // affichees : filtrer une dette sur un moyen de paiement ne veut
          // rien dire. On le signale plutot que de laisser croire le contraire.
          hint: horsFiltre,
        },
        {
          label: cloisonne ? "Encaissé par vous" : "Collecté",
          value: `${summary.total_paid.toLocaleString("fr-FR")} F`,
          icon: Wallet,
          hint: avec(`${summary.payment_count} paiement(s)`, surLeFiltre),
        },
        {
          label: "En attente",
          value: `${summary.total_pending.toLocaleString("fr-FR")} F`,
          icon: AlertCircle,
          hint: surLeFiltre,
        },
        {
          label: "Taux de recouvrement",
          value: cloisonne ? "—" : `${summary.completion_rate!.toFixed(1)}%`,
          icon: TrendingUp,
          hint: avec(
            summary.total_cancelled > 0
              ? `${summary.total_cancelled.toLocaleString("fr-FR")} FCFA annulés`
              : undefined,
            horsFiltre,
          ),
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
            <PaymentsTable
              payments={payments}
              downloadingId={downloadingId}
              onPreviewReceipt={handlePreviewReceipt}
              onValidate={(p) => setConfirmAction({ type: "validate", payment: p })}
              onCancel={(p) => setConfirmAction({ type: "cancel", payment: p })}
            />
            <PaymentsCardList
              payments={payments}
              onPreviewReceipt={handlePreviewReceipt}
              onValidate={(p) => setConfirmAction({ type: "validate", payment: p })}
              onCancel={(p) => setConfirmAction({ type: "cancel", payment: p })}
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* La sentinelle : charger la suite en approchant du bas, plutot que
          d'obliger a viser un numero de page. */}
      <div ref={sentinelle} aria-hidden="true" className="h-px" />

      {payments.length > 0 && (
        <div className="pb-2 text-center text-xs text-muted-foreground">
          {isFetchingNextPage
            ? "Chargement…"
            : hasNextPage
              ? `${payments.length} sur ${total} versements`
              : `${payments.length} versement(s), tout est affiché`}
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
