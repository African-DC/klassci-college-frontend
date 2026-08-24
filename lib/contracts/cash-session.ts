import { z } from "zod"

/**
 * Une journée de caisse : ce qu'un caissier a encaissé un jour donné, et si
 * cette journée est encore ouverte ou déjà clôturée.
 *
 * Les montants sont attendus en `number`. Le backend les sérialise
 * explicitement en float pour cette raison : un `Decimal` Pydantic arrive
 * sous forme de chaîne et ferait échouer la validation
 * (cf. rule `api-client-zod-validation`).
 */
export const CashMethodTotalSchema = z.object({
  method: z.string(),
  label: z.string(),
  count: z.number(),
  total: z.number(),
})

export const CashSessionSchema = z.object({
  id: z.number(),
  cashier_user_id: z.number(),
  cashier_name: z.string(),
  business_date: z.string(),
  status: z.string(),
  opened_at: z.string(),
  closed_at: z.string().nullish(),
  // Nuls sur une journee clôturée d'office : le tiroir n'a pas été compté et
  // l'écart est INCONNU. Surtout pas zéro, qui dirait « la caisse tombe juste ».
  counted_amount: z.number().nullish(),
  expected_amount: z.number().nullish(),
  variance: z.number().nullish(),
  regularized_at: z.string().nullish(),
  notes: z.string().nullish(),
  payments_count: z.number(),
  total_collected: z.number(),
  cash_collected: z.number(),
  by_method: z.array(CashMethodTotalSchema),
})

export const CashSessionListSchema = z.object({
  items: z.array(CashSessionSchema),
  business_date: z.string(),
  total_collected: z.number(),
  cash_collected: z.number(),
  total_variance: z.number(),
  open_count: z.number(),
  closed_count: z.number(),
  // Clôturées d'office : ni encore en service, ni arrêtées par quelqu'un.
  // Leur écart n'entre pas dans `total_variance`, qui ne se lit donc pas
  // comme un solde complet.
  //
  // `.optional()` et non `.default(0)` : un défaut Zod fait diverger le type
  // d'entrée du type de sortie, et `safeValidate` rend alors un objet que
  // TypeScript refuse d'assigner au type inféré. Les appelants écrivent
  // `?? 0`, ce qui dit aussi honnêtement « pas encore renseigné ».
  auto_closed_count: z.number().optional(),
})

export const CashSessionRegularizeSchema = z.object({
  counted_amount: z
    .number({ invalid_type_error: "Saisissez le montant compté" })
    .min(0, "Le montant ne peut pas être négatif"),
  notes: z.string().max(1000, "1000 caractères maximum").optional(),
})

export const CashSessionCloseSchema = z.object({
  counted_amount: z
    .number({ invalid_type_error: "Saisissez le montant compté" })
    .min(0, "Le montant ne peut pas être négatif"),
  notes: z.string().max(1000, "1000 caractères maximum").optional(),
})

export type CashMethodTotal = z.infer<typeof CashMethodTotalSchema>
export type CashSession = z.infer<typeof CashSessionSchema>
export type CashSessionList = z.infer<typeof CashSessionListSchema>
export type CashSessionClose = z.infer<typeof CashSessionCloseSchema>
export type CashSessionRegularize = z.infer<typeof CashSessionRegularizeSchema>

/** Les trois états d'une journée de caisse, tels que le backend les nomme. */
export const CASH_STATUS = {
  OPEN: "open",
  /** Clôturée par son caissier, qui a compté son tiroir. */
  CLOSED: "closed",
  /** Clôturée d'office à minuit, sans comptage. Écart inconnu. */
  AUTO_CLOSED: "auto_closed",
} as const

/**
 * `true` quand la journée est verrouillée : plus d'encaissement ni d'annulation.
 *
 * Une journée clôturée d'office l'est tout autant qu'une journée signée — son
 * théorique est figé. Ne pas remplacer par `status === "closed"` : l'écran
 * proposerait de clôturer une journée déjà verrouillée.
 */
export function isLocked(session: Pick<CashSession, "status">): boolean {
  return session.status !== CASH_STATUS.OPEN
}

/** `true` quand personne n'a compté le tiroir : l'écart est inconnu, pas nul. */
export function isAutoClosed(session: Pick<CashSession, "status">): boolean {
  return session.status === CASH_STATUS.AUTO_CLOSED
}

/**
 * `true` quand la journée porte un comptage réel, donc un écart qui veut dire
 * quelque chose. C'est la seule condition sous laquelle afficher un écart.
 */
export function hasBeenCounted(session: Pick<CashSession, "status">): boolean {
  return session.status === CASH_STATUS.CLOSED
}
