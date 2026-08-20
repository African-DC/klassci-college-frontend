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
  counted_amount: z.number().nullish(),
  expected_amount: z.number().nullish(),
  variance: z.number().nullish(),
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

/** `true` quand la journée est verrouillée : plus d'encaissement ni d'annulation. */
export function isClosed(session: Pick<CashSession, "status">): boolean {
  return session.status === "closed"
}
