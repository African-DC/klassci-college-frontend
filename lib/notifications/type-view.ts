import {
  AlertCircle,
  ClipboardList,
  CreditCard,
  FileText,
  Settings,
  UserCheck,
} from "lucide-react"
import type { ComponentType } from "react"
import type { NotificationType } from "@/lib/contracts/notification"

/** Ce qu'un type de notification donne à voir. */
export interface NotificationTypeView {
  Icon: ComponentType<{ className?: string }>
  /** Les classes de la pastille, fond et texte, clair et sombre. */
  tone: string
  label: string
}

const AMBRE = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"

const TYPES: Record<NotificationType, NotificationTypeView> = {
  payment_due: { Icon: CreditCard, tone: AMBRE, label: "Paiement dû" },
  payment_received: {
    Icon: CreditCard,
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    label: "Paiement reçu",
  },
  grade_available: {
    Icon: ClipboardList,
    tone: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Note disponible",
  },
  bulletin_published: {
    Icon: FileText,
    tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    label: "Bulletin publié",
  },
  absence_recorded: {
    Icon: AlertCircle,
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    label: "Absence enregistrée",
  },
  enrollment_status: {
    Icon: UserCheck,
    tone: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    label: "Inscription",
  },
  // Les deux temps de la chaîne d'inscription. Ambre pour les deux, parce que
  // ce sont des tâches à faire et non des événements passés : c'est la teinte
  // que le reste du produit emploie déjà pour « il reste quelque chose à poser ».
  enrollment_awaiting_payment: { Icon: CreditCard, tone: AMBRE, label: "Versement attendu" },
  enrollment_awaiting_validation: { Icon: UserCheck, tone: AMBRE, label: "Inscription à valider" },
  system: {
    Icon: Settings,
    tone: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    label: "Système",
  },
}

/**
 * L'icône, la teinte et le libellé d'un type de notification.
 *
 * Ces trois tables existaient en double, dans la cloche et dans la page des
 * notifications. Ajouter un type obligeait à modifier six endroits, et rien
 * n'obligeait à les modifier tous — le compilateur signalait les tables
 * typées, pas les divergences de couleur entre deux copies.
 *
 * Un type inconnu ne fait pas disparaître la ligne : il s'affiche avec
 * l'apparence neutre du système, ce qui vaut mieux qu'une notification
 * invisible parce que le serveur a pris de l'avance sur le client.
 */
export function notificationTypeView(type: string): NotificationTypeView {
  return TYPES[type as NotificationType] ?? TYPES.system
}

/**
 * Les notifications affichées qui restent à marquer comme lues.
 *
 * Extrait de la cloche pour être vérifiable : c'est cette sélection qui
 * décide de ce qui disparaît du compteur, et une erreur ici efface des tâches
 * que personne n'a vues. Le composant ne fait plus que la déclencher.
 */
export function idsAMarquerCommeVues(
  affichees: ReadonlyArray<{ id: number; read: boolean }> | undefined,
): number[] {
  if (!affichees) return []
  return affichees.filter((n) => !n.read).map((n) => n.id)
}
