/**
 * Les moyens de paiement : lesquels existent, dans quel ordre, comment ils s'appellent.
 *
 * Miroir de `app/core/payment_methods.py` côté backend. Six écrans en gardaient
 * chacun leur copie, et elles avaient déjà divergé : un libellé disait
 * « Mobile Money », un autre « Mobile Money (Wave / Orange / MTN) ». Une seule
 * table ici, tout le monde la lit.
 */

/**
 * Ordre d'affichage, par fréquence réelle au guichet ivoirien et NON par ordre
 * alphabétique. Les espèces d'abord parce que c'est le cas courant au comptoir,
 * puis les opérateurs mobile money par part de marché (Wave devant, MTN MoMo
 * ensuite, Orange Money et Moov Money derrière), et enfin les moyens bancaires,
 * rares au guichet d'un collège.
 *
 * Merci de ne PAS re-trier alphabétiquement : ce serait ranger le plus rare
 * devant le plus fréquent dans un sélecteur utilisé cinquante fois par jour.
 */
export const SELECTABLE_PAYMENT_METHODS = [
  "cash",
  "wave",
  "mtn_momo",
  "orange_money",
  "moov_money",
  "bank_transfer",
  "cheque",
] as const

/**
 * Valeurs encore présentes en base mais retirées de la saisie.
 *
 * `mobile_money` a précédé la distinction des quatre opérateurs. Les versements
 * enregistrés sous cette valeur ne sont pas réécrits : personne ne peut savoir
 * après coup lequel était Wave et lequel était Moov Money, et un reçu déjà remis
 * à une famille cesserait de correspondre au papier qu'elle détient. Ils restent
 * donc lisibles et affichés tels quels.
 */
export const HISTORICAL_PAYMENT_METHODS = ["mobile_money"] as const

/** Tout ce qu'un écran peut rencontrer. L'historique ferme la marche. */
export const ALL_PAYMENT_METHODS = [
  ...SELECTABLE_PAYMENT_METHODS,
  ...HISTORICAL_PAYMENT_METHODS,
] as const

export type SelectablePaymentMethod = (typeof SELECTABLE_PAYMENT_METHODS)[number]
export type AnyPaymentMethod = (typeof ALL_PAYMENT_METHODS)[number]

/**
 * Noms commerciaux, écrits comme les opérateurs les écrivent.
 *
 * `mobile_money` garde son libellé d'origine, sans mention « historique » :
 * il figure tel quel sur des reçus déjà remis, et un reçu réimprimé doit dire
 * ce que la famille a sur son papier.
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  mtn_momo: "MTN MoMo",
  orange_money: "Orange Money",
  moov_money: "Moov Money",
  bank_transfer: "Virement bancaire",
  cheque: "Chèque",
  mobile_money: "Mobile Money",
}

/**
 * Les moyens qui engagent un tiroir physique, donc une journée de caisse
 * ouverte et un comptage en fin de journée.
 */
export const DRAWER_PAYMENT_METHODS: readonly string[] = ["cash"]

/**
 * Libellé d'un moyen. Repli sur la clé brute plutôt que sur un « Autre »
 * fourre-tout : une valeur inconnue doit se voir à l'écran, pas se fondre dans
 * une catégorie qui ferait mentir la ligne.
 */
export function paymentMethodLabel(key: string): string {
  return PAYMENT_METHOD_LABELS[key] ?? key
}

/**
 * Trie des moyens selon l'ordre métier, sans jamais en perdre un.
 *
 * Les clés connues sortent dans l'ordre d'affichage ; celles qui ne le sont pas
 * suivent, triées, plutôt que d'être silencieusement omises.
 */
export function orderPaymentMethods(keys: Iterable<string>): string[] {
  const present = new Set(keys)
  const known = ALL_PAYMENT_METHODS.filter((m) => present.has(m)) as string[]
  const unknown = [...present].filter((m) => !ALL_PAYMENT_METHODS.includes(m as AnyPaymentMethod))
  return [...known, ...unknown.sort()]
}
