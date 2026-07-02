import type { Payment, PaymentMethod, PaymentStatus } from "@/lib/contracts/payment"
import type { SchoolSettings } from "@/lib/contracts/settings"
import type { ExportPayload } from "@/lib/export"
import { brandingFromSettings } from "@/lib/export/branding"

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement",
  cheque: "Chèque",
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "En attente",
  completed: "Validé",
  failed: "Échoué",
  refunded: "Remboursé",
  cancelled: "Annulé",
}

interface PaymentsExportArgs {
  payments: Payment[]
  settings: SchoolSettings | undefined
  /** Résumé lisible des filtres actifs (statut, méthode, période, recherche). */
  filters?: string
}

/**
 * Construit la charge utile d'export des paiements tels qu'affichés (page
 * courante, filtres appliqués). Le montant total figure en ligne « Total ».
 * Note : le tableau expose le frais alloué (`fee_name`), la classe n'étant pas
 * portée par la ligne de paiement.
 */
export function buildPaymentsExportPayload({
  payments,
  settings,
  filters,
}: PaymentsExportArgs): ExportPayload {
  const total = payments.reduce((sum, p) => sum + p.amount, 0)
  return {
    branding: brandingFromSettings(settings),
    meta: {
      title: "Liste des paiements",
      subtitle: `${payments.length} paiement(s) affiché(s)`,
      filters,
      date: new Date().toLocaleDateString("fr-FR"),
    },
    columns: [
      { key: "date", header: "Date", format: "date" },
      { key: "reference", header: "Référence" },
      { key: "eleve", header: "Élève" },
      { key: "frais", header: "Frais" },
      { key: "methode", header: "Méthode" },
      { key: "statut", header: "Statut" },
      { key: "montant", header: "Montant", format: "xof" },
    ],
    rows: payments.map((p) => ({
      date: p.created_at,
      reference: p.reference ?? "",
      eleve: p.student_name ?? "",
      frais: p.fee_name ?? "",
      methode: METHOD_LABELS[p.method],
      statut: STATUS_LABELS[p.status],
      montant: p.amount,
    })),
    totalsRow: { eleve: "Total", montant: total },
  }
}
