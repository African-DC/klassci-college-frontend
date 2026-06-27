"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus, CheckCircle, XCircle, Download, Wallet, TrendingUp,
  AlertCircle, Banknote, CreditCard, Search, X, Eye,
  Receipt, Coins, Smartphone, Building2, FileText, CalendarDays,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero, heroAccentBtn, type HeroKpi } from "@/components/shared/PageHero"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { PaymentCreateWizard } from "./PaymentCreateWizard"
import { usePayments, useFinancialSummary, useValidatePayment, useCancelPayment } from "@/lib/hooks/usePayments"
import { useFeeCategories } from "@/lib/hooks/useFees"
import { paymentsApi } from "@/lib/api/payments"
import { useDebounce } from "@/lib/hooks/useDebounce"
import type { PaymentListParams, PaymentStatus, PaymentMethod, Payment } from "@/lib/contracts/payment"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

const STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; dot: string }> = {
  pending: { label: "En attente", variant: "secondary", dot: "bg-amber-500" },
  completed: { label: "Validé", variant: "default", dot: "bg-emerald-500" },
  failed: { label: "Échoué", variant: "destructive", dot: "bg-red-500" },
  refunded: { label: "Remboursé", variant: "outline", dot: "bg-blue-500" },
  cancelled: { label: "Annulé", variant: "destructive", dot: "bg-rose-500" },
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement",
  cheque: "Chèque",
}

const METHOD_ICON_MAP: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = {
  cash: Coins,
  mobile_money: Smartphone,
  bank_transfer: Building2,
  cheque: FileText,
}

export function PaymentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>(undefined)
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ type: "validate" | "cancel"; payment: Payment } | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewPaymentId, setPreviewPaymentId] = useState<number | null>(null)

  const debouncedSearch = useDebounce(search)

  const params: PaymentListParams = {
    ...(statusFilter && { status: statusFilter }),
    ...(methodFilter && { method: methodFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(categoryFilter && { fee_category_id: Number(categoryFilter) }),
  }

  const { data, isLoading } = usePayments(params)
  const { data: summary } = useFinancialSummary()
  const { mutate: validatePayment, isPending: validating } = useValidatePayment()
  const { mutate: cancelPayment, isPending: cancelling } = useCancelPayment()
  const { data: feeCategories } = useFeeCategories()

  // Client-side date filtering (BE doesn't support date params yet)
  const payments = useMemo(() => {
    let items = data?.items ?? []
    if (dateFrom) {
      const from = new Date(dateFrom)
      items = items.filter((p) => new Date(p.created_at) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59")
      items = items.filter((p) => new Date(p.created_at) <= to)
    }
    return items
  }, [data, dateFrom, dateTo])

  const activeFilterCount = [statusFilter, methodFilter, categoryFilter, dateFrom, dateTo].filter(Boolean).length

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

  function handleConfirmAction() {
    if (!confirmAction) return
    const onSuccess = () => setConfirmAction(null)
    if (confirmAction.type === "validate") {
      validatePayment(confirmAction.payment.id, { onSuccess })
    } else {
      cancelPayment(confirmAction.payment.id, { onSuccess })
    }
  }

  function clearFilters() {
    setStatusFilter(undefined)
    setMethodFilter(undefined)
    setCategoryFilter(undefined)
    setDateFrom("")
    setDateTo("")
    setSearch("")
  }

  const heroKpis: HeroKpi[] | undefined = summary
    ? [
        {
          label: "Attendu",
          value: `${summary.total_expected.toLocaleString("fr-FR")} F`,
          icon: Banknote,
        },
        {
          label: "Collecté",
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
          value: `${summary.completion_rate.toFixed(1)}%`,
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
          <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau paiement
          </button>
        }
        kpis={heroKpis}
      />

      {/* Barre de recherche + filtres */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par élève, référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtres rapides */}
            <Select
              value={statusFilter ?? "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? undefined : (v as PaymentStatus))}
            >
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Validé</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={methodFilter ?? "all"}
              onValueChange={(v) => setMethodFilter(v === "all" ? undefined : (v as PaymentMethod))}
            >
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue placeholder="Méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes méthodes</SelectItem>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Virement</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre catégorie de frais */}
            <Select
              value={categoryFilter ?? "all"}
              onValueChange={(v) => setCategoryFilter(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {feeCategories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-xs text-muted-foreground">
                <X className="mr-1 h-3 w-3" />
                Réinitialiser ({activeFilterCount})
              </Button>
            )}
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2 mt-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground shrink-0">Période :</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-xs w-[140px]"
              placeholder="Du"
            />
            <span className="text-xs text-muted-foreground">au</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-xs w-[140px]"
              placeholder="Au"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo("") }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

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
                {activeFilterCount > 0 || search
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
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: Payment) => {
                  const statusCfg = STATUS_CONFIG[payment.status]
                  const MethodIcon = METHOD_ICON_MAP[payment.method]
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
                          <span className="text-sm">{METHOD_LABELS[payment.method]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
                          <span className="text-sm">{statusCfg.label}</span>
                        </div>
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
                          className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {payment.status === "pending" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setConfirmAction({ type: "validate", payment })}
                                title="Valider"
                              >
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setConfirmAction({ type: "cancel", payment })}
                                title="Annuler"
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handlePreviewReceipt(payment)}
                            disabled={downloadingId === payment.id}
                            title="Voir le reçu"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                const MethodIcon = METHOD_ICON_MAP[payment.method]
                const initials = payment.student_name
                  ? payment.student_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                  : "?"
                return (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => handlePreviewReceipt(payment)}
                    className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/40 active:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                            {METHOD_LABELS[payment.method]}
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
                        {payment.fee_name && (
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {payment.fee_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
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

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "validate" ? "Valider ce paiement ?" : "Annuler ce paiement ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "validate"
                ? `Vous allez valider le paiement de ${Number(confirmAction.payment.amount).toLocaleString("fr-FR")} FCFA. Cette action est irréversible.`
                : `Vous allez annuler le paiement de ${Number(confirmAction?.payment.amount).toLocaleString("fr-FR")} FCFA. Cette action est irréversible.`}
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

      {/* Receipt Preview Dialog */}
      <Dialog open={previewUrl !== null} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Reçu de paiement #{previewPaymentId}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-[65vh] rounded-lg border"
              title="Aperçu du reçu"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePreview}>
              Fermer
            </Button>
            <Button onClick={handleDownloadFromPreview}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger le PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Student Avatar with fallback
// ---------------------------------------------------------------------------

function StudentAvatar({ photoUrl, initials }: { photoUrl?: string | null; initials: string }) {
  const [imgError, setImgError] = useState(false)
  const fullUrl = photoUrl && !imgError ? `${API_URL}${photoUrl}` : null

  if (fullUrl) {
    return (
      <img
        src={fullUrl}
        alt=""
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials}
    </div>
  )
}
