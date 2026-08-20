import { z } from "zod"

/**
 * Etat de la porte de paiement sur les documents officiels d'un eleve.
 *
 * Le declencheur est le retard sur l'echeancier, jamais le solde de l'annee :
 * une famille a jour de sa premiere tranche en novembre doit pouvoir obtenir
 * un certificat pour une bourse ou une carte de transport.
 */
export const DocumentReleaseStatusSchema = z.object({
  blocked: z.boolean(),
  late_amount: z.coerce.number(),
  reason: z.string().nullish(),
  /** L'utilisateur courant a la permission `documents:release:override`. */
  can_override: z.boolean(),
})

export type DocumentReleaseStatus = z.infer<typeof DocumentReleaseStatusSchema>

/** Code renvoye par le backend dans le `detail` d'un 402. */
export const DOCUMENT_BLOCKED_CODE = "DOCUMENT_BLOCKED_BY_ARREARS"

export interface DocumentBlockedDetail {
  code: typeof DOCUMENT_BLOCKED_CODE
  message: string
  late_amount: number
  student_id: number
  can_override: boolean
}

/**
 * Reconnait le refus pour impaye parmi les erreurs d'un telechargement.
 *
 * Le client HTTP ne connait pas la semantique des codes metier : c'est ici
 * qu'on la lit, pour que la porte de paiement reste un seul concept.
 */
export function asDocumentBlocked(error: unknown): DocumentBlockedDetail | null {
  const detail = (error as { detail?: unknown } | null)?.detail
  if (detail === null || typeof detail !== "object") return null
  const candidate = detail as Record<string, unknown>
  if (candidate.code !== DOCUMENT_BLOCKED_CODE) return null
  return {
    code: DOCUMENT_BLOCKED_CODE,
    message: String(candidate.message ?? "Document retenu pour impayé."),
    late_amount: Number(candidate.late_amount ?? 0),
    student_id: Number(candidate.student_id ?? 0),
    can_override: Boolean(candidate.can_override),
  }
}
