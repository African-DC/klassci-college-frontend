/**
 * Quels versements se contre-passent, et comment les nommer à voix haute.
 *
 * La règle surprend, donc elle est nommée plutôt que recopiée dans un JSX :
 * un versement **déjà encaissé** s'annule. C'est même le cas courant au
 * guichet — la caissière a saisi un montant qui n'est pas dans le tiroir, et
 * il faut le dire avant la clôture. L'écran ne proposait le geste qu'aux
 * versements « en attente », alors que le serveur acceptait les deux : le seul
 * cas qui arrive vraiment était donc injoignable.
 *
 * C'est le miroir de `VALID_TRANSITIONS` côté serveur, restreint à la
 * transition qui nous intéresse ici :
 *
 *     pending   → completed, cancelled
 *     completed → refunded,  cancelled     ← la correction comptable
 *     failed / refunded / cancelled → rien
 *
 * Ce que ce module **ne dit pas** : qui a le droit. Le serveur le sait seul —
 * il connaît la permission et surtout la clôture de la journée de caisse,
 * qu'aucun navigateur ne peut deviner. Il filtre déjà la liste pour qu'une
 * caissière ne voie que ses propres saisies. Rejouer ce calcul ici n'éviterait
 * aucun refus, et en manquerait un vrai.
 */

import type { Payment, PaymentStatus } from "@/lib/contracts/payment"

/** On ne valide que ce qui n'est pas encore entré en caisse. */
export function canValidatePayment(status: PaymentStatus): boolean {
  return status === "pending"
}

/** Un versement se contre-passe tant qu'il compte encore dans la caisse. */
export function canCancelPayment(status: PaymentStatus): boolean {
  return status === "pending" || status === "completed"
}

/**
 * Devant une voyelle, « de » s'élide — cette phrase est lue à voix haute.
 *
 * Le Y initial fait exception : on dit « de Yao », jamais « d'Yao ». Et Yao,
 * Yapo, Yeo comptent parmi les noms les plus portés en Côte d'Ivoire.
 */
const VOWEL = /^[aeiouâàéèêîïôöûü]/i

/**
 * Le complément qui suit « le versement » dans le nom accessible d'un bouton.
 *
 * Sans lui, une liste de vingt lignes annonce vingt fois « Annuler », sur un
 * geste financier irréversible. Le nom de l'élève manque parfois : on nomme
 * alors le versement par son numéro, plutôt que d'accoler « de » à une phrase
 * qui n'en veut pas — « le versement de versement nº 42 » ne se dit pas.
 */
export function paymentSubject(payment: Pick<Payment, "id" | "student_name">): string {
  const name = payment.student_name?.trim()
  if (!name) return `nº ${payment.id}`
  return VOWEL.test(name) ? `d'${name}` : `de ${name}`
}
