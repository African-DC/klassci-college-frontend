"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus, Download, Wallet, TrendingUp,
  AlertCircle, Banknote, CreditCard, Eye,
  Receipt, FileSpreadsheet, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { buildAccountingScope, isValidAccountingDate, scopeTitle, todayLocal, type PaymentScope } from "@/lib/payment-accounting-scope"
import { PaymentsFilters } from "@/components/admin/payments/PaymentsFilters"
import {
  AcademicYearChip,
  AcademicYearScopeBar,
} from "@/components/shared/AcademicYearScopeBar"
import { usePaymentFilters } from "@/lib/hooks/usePaymentFilters"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
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
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | "preview" | "daily" | null>(null)

  const { filters, set, reset, params, activeCount } = usePaymentFilters()
  // `undefined` tant que l'utilisateur n'a rien choisi : l'écran suit alors
  // l'année marquée courante. Sans ça, le journal additionnait 2025-2026
  // et 2026-2027, et « Collecté » gonflait de l'exercice d'à côté.
  const [pickedYearId, setPickedYearId] = useState<number | undefined>(undefined)
  const [paymentScope, setPaymentScope] = useState<PaymentScope>("current_year")
  const [accountingDate, setAccountingDate] = useState(todayLocal)
  const { academicYearId, years, isLoading: loadingYears } = useCurrentAcademicYearId(pickedYearId)
  const selectedYear = years?.find((y) => y.id === academicYearId)
  const currentYear = years?.find((y) => y.is_current)

  const scopeParams = useMemo(
    () => buildAccountingScope(paymentScope, academicYearId, paymentScope === "today" ? todayLocal() : accountingDate),
    [paymentScope, academicYearId, accountingDate],
  )
  const scopedParams = useMemo(() => ({
    ...params,
    ...(paymentScope !== "current_year" ? { date_from: undefined, date_to: undefined } : {}),
    ...scopeParams,
  }), [params, scopeParams, paymentScope])
  const allYears = paymentScope !== "current_year"
  const dateValid = (paymentScope !== "date" && paymentScope !== "week") ||
    isValidAccountingDate(accountingDate)
  const scopeReady = (allYears || academicYearId != null) && dateValid

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePayments(scopedParams, scopeReady && allYears)
  // Le bandeau recoit les memes criteres que la liste : sinon il annonce
  // l'annee entiere au-dessus de trois lignes filtrees.
  const { data: rawSummary } = useFinancialSummary(allYears ? undefined : academicYearId, scopedParams, scopeReady && allYears)
  const summary = scopeReady ? rawSummary : undefined
  const { mutate: validatePayment, isPending: validating } = useValidatePayment()
  const { mutate: cancelPayment, isPending: cancelling } = useCancelPayment()
  const { data: feeCategories } = useFeeCategories()
  const { data: cashiers } = useCashiers()

  // Les pages chargees, mises bout a bout.
  const payments = useMemo(
    () => scopeReady ? data?.pages.flatMap((page) => page.items) ?? [] : [],
    [data, scopeReady],
  )
  const total = scopeReady ? data?.pages[0]?.total ?? 0 : 0

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
    if (!scopeReady) return
    setExporting(format)
    try {
      const blob = await paymentsApi.downloadJournal(scopedParams, format)
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

  async function handleDailyCashBook() {
    if (!scopeReady) return
    const day = paymentScope === "today" ? todayLocal() : accountingDate
    setExporting("daily")
    try {
      const blob = await paymentsApi.downloadDailyCashBook(day)
      downloadBlob(blob, `bordereau-${day}.pdf`)
      toast.success("Bordereau comptable téléchargé")
    } catch (err) {
      toast.error("Bordereau indisponible", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setExporting(null)
    }
  }

  async function handleExportPreview() {
    if (!scopeReady) return
    setExporting("preview")
    try {
      await openPdfPreview(() => paymentsApi.downloadJournal(scopedParams, "pdf"))
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
  const cloisonne = !allYears && summary?.total_expected === null

  // Un filtre actif change le sens de la moitie des chiffres. Le dire sur
  // chaque carte evite de lire « 3 versements » en ayant oublie un filtre
  // pose dix minutes plus tot, et de croire que la caisse est vide.
  const filtre = activeCount > 0 || Boolean(filters.search)
  const surLeFiltre = filtre ? "sur le filtre actif" : undefined
  const horsFiltre = allYears ? "Recouvrement annuel non applicable" : filtre ? "toute l'année, hors filtre" : undefined
  const avec = (base: string | undefined, mention: string | undefined) =>
    [base, mention].filter(Boolean).join(" · ") || undefined

  const heroKpis: HeroKpi[] | undefined = summary
    ? [
        {
          label: "Attendu",
          // Une caissiere ne lit pas le recouvrement de l'etablissement : le
          // tiret dit « pas de votre ressort », la ou un 0 F dirait « rien
          // n'est du ».
          value: cloisonne || allYears ? "—" : `${summary.total_expected!.toLocaleString("fr-FR")} F`,
          icon: Banknote,
          // Le recouvrement parle de la dette de l'ecole, pas des lignes
          // affichees : filtrer une dette sur un moyen de paiement ne veut
          // rien dire. On le signale plutot que de laisser croire le contraire.
          hint: horsFiltre,
        },
        {
          label: cloisonne ? "Encaissé par vous" : "Total encaissé",
          value: summary.total_collected == null ? "—" : `${summary.total_collected.toLocaleString("fr-FR")} F`,
          icon: Wallet,
          // Cloisonne, ce montant est la recette de la personne, agregee sur
          // les memes versements que le compte : la carte entiere suit le
          // filtre. Sinon c'est ce que l'ecole a percu sur sa dette, qui ne
          // le suit pas, et melanger les deux ferait affirmer a la carte une
          // portee qu'elle n'a pas.
          hint: `${summary.payment_count} paiement(s) · même périmètre que le journal`,
        },
        {
          label: "En attente",
          value: `${summary.total_pending.toLocaleString("fr-FR")} F`,
          icon: AlertCircle,
          hint: surLeFiltre,
        },
        {
          label: "Taux de recouvrement",
          value: cloisonne || allYears ? "—" : `${summary.completion_rate!.toFixed(1)}%`,
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
        subtitle={
          paymentScope === "current_year" && selectedYear
            ? `Suivi des paiements et tableau de bord financier · Année ${selectedYear.name}`
            : "Suivi des paiements et tableau de bord financier"
        }
        actions={
          <>
            <button
              type="button"
              className={`${heroGlassBtn} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => handleExport("xlsx")}
              disabled={!scopeReady || exporting !== null || payments.length === 0}
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
              disabled={!scopeReady || exporting !== null || payments.length === 0}
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
              disabled={!scopeReady || exporting !== null || payments.length === 0}
              aria-label="Télécharger le journal des versements au format PDF"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              PDF
            </button>
            {(paymentScope === "today" || paymentScope === "date") && (
              <button
                type="button"
                className={`${heroGlassBtn} disabled:cursor-not-allowed disabled:opacity-50`}
                onClick={handleDailyCashBook}
                disabled={!scopeReady || exporting !== null || activeCount > 0 || Boolean(filters.search)}
                title="Bordereau complet de la date, disponible sans filtre complémentaire"
              >
                {exporting === "daily" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                Bordereau du {paymentScope === "today" ? "jour" : "jour choisi"}
              </button>
            )}
            <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouveau paiement
            </button>
          </>
        }
        kpis={heroKpis}
      />

      <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3" aria-label="Périmètre comptable des paiements">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm font-medium">Périmètre comptable</span>
          <Select value={paymentScope} onValueChange={(value) => {
            const next = value as PaymentScope
            setPaymentScope(next)
            if (next !== "current_year") {
              // Do not keep hidden date-range filters when switching to day/week/history.
              set("dateFrom", "")
              set("dateTo", "")
            }
          }}>
            <SelectTrigger className="w-full sm:w-[290px]" aria-label="Choisir le périmètre des paiements">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_year">Année scolaire sélectionnée</SelectItem>
              <SelectItem value="today">Aujourd’hui — toutes années</SelectItem>
              <SelectItem value="date">Date précise — toutes années</SelectItem>
              <SelectItem value="week">Semaine — toutes années</SelectItem>
              <SelectItem value="all">Tous les paiements</SelectItem>
            </SelectContent>
          </Select>
          {(paymentScope === "date" || paymentScope === "week") && (
            <Input type="date" aria-label={paymentScope === "week" ? "Choisir une date dans la semaine" : "Choisir la date"} value={accountingDate} onChange={(event) => setAccountingDate(event.target.value)} className="w-full sm:w-[180px]" />
          )}
        </div>
        <p className="text-sm text-muted-foreground" role="status">{scopeTitle[paymentScope]}{paymentScope === "week" ? ` · semaine du ${scopeParams.date_from?.slice(0, 10) ?? "—"} au ${scopeParams.date_to?.slice(0, 10) ?? "—"}` : paymentScope === "date" ? ` · ${accountingDate}` : ""}. Le journal, les totaux de caisse et les exports respectent ce périmètre.</p>
        {!dateValid && <p role="alert" className="text-sm text-destructive">Sélectionnez une date valide avant de consulter ou d’exporter des paiements.</p>}
      </div>

      {paymentScope === "current_year" && <AcademicYearScopeBar
        years={years}
        selectedYearId={academicYearId}
        onSelect={setPickedYearId}
        isLoading={loadingYears}
        selectId="payments-academic-year"
        currentHelper="Liste, bandeau et exports portent sur cette année. Un encaissement d'une autre année n'y figure pas."
        offYearWarning={
          `Ce n'est pas l'année en cours${currentYear ? ` (${currentYear.name})` : ""}. ` +
          "Les totaux et le journal ci-dessous ne parlent plus de l'exercice actuel."
        }
      />}

      <PaymentsFilters
        filters={filters}
        set={set}
        reset={reset}
        activeCount={activeCount}
        feeCategories={feeCategories}
        cashiers={cashiers}
        showCashier={showCashierFilter}
        showDateRange={paymentScope === "current_year"}
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
            <div className="flex items-center px-4 pt-4 md:hidden">
              {paymentScope === "current_year" && <AcademicYearChip year={selectedYear} />}
            </div>
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
