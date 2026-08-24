import { paymentMethodIcon } from "@/components/admin/payments/method-icon"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { Payment, PaymentStatus } from "@/lib/contracts/payment"

const STATUS_CONFIG: Record<PaymentStatus, { label: string; dot: string }> = {
  pending: { label: "En attente", dot: "bg-amber-500" },
  completed: { label: "Validé", dot: "bg-emerald-500" },
  failed: { label: "Échoué", dot: "bg-red-500" },
  refunded: { label: "Remboursé", dot: "bg-blue-500" },
  cancelled: { label: "Annulé", dot: "bg-rose-500" },
}

/** Ce qu'une ligne du journal affiche, quelle que soit sa forme. */
export interface PaymentRowView {
  statusLabel: string
  /** La classe de la pastille de couleur du statut. */
  statusDot: string
  methodLabel: string
  MethodIcon: ReturnType<typeof paymentMethodIcon>
  /** Deux lettres, ou « ? » quand le nom manque. */
  initials: string
  /**
   * La phrase d'annulation — quand, par qui, pourquoi — ou `null`.
   *
   * Elle est conditionnée au motif, pas au statut : un versement annulé
   * avant que le motif ne devienne obligatoire n'a rien à dire de plus que
   * son badge « Annulé », et la ligne se réduirait à le répéter.
   */
  cancellation: string | null
}

/**
 * Ce qu'il faut dériver d'un versement pour l'afficher.
 *
 * Le même journal se lit sous deux formes : un tableau dense au bureau, des
 * cartes sur un téléphone. Les deux dérivaient ces cinq valeurs chacune de
 * leur côté, à l'identique — et la seule chose qu'une telle copie garantit,
 * c'est qu'un jour l'une des deux changera sans l'autre, et que la caissière
 * lira deux vérités selon l'appareil qu'elle a en main.
 */
export function paymentRowView(payment: Payment): PaymentRowView {
  const status = STATUS_CONFIG[payment.status]
  return {
    statusLabel: status.label,
    statusDot: status.dot,
    methodLabel: paymentMethodLabel(payment.method),
    MethodIcon: paymentMethodIcon(payment.method),
    initials: payment.student_name
      ? payment.student_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
      : "?",
    cancellation: payment.cancellation_reason ? phraseAnnulation(payment) : null,
  }
}

function phraseAnnulation(p: Payment): string {
  const quand = p.cancelled_at
    ? ` le ${new Date(p.cancelled_at).toLocaleDateString("fr-FR")}`
    : ""
  const qui = p.cancelled_by_name ? ` par ${p.cancelled_by_name}` : ""
  const pourquoi = p.cancellation_reason ? ` · ${p.cancellation_reason}` : ""
  return `Annulé${quand}${qui}${pourquoi}`
}
