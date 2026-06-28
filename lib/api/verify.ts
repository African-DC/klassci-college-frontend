import { z } from "zod"

/**
 * Vérification publique d'authenticité de document scolaire.
 *
 * Cet appel est PUBLIC : aucun token d'auth, aucune session. Il est conçu pour
 * tourner côté serveur (Server Component) afin d'avoir un rendu SSR propre.
 *
 * Résolution du BASE :
 *   - côté serveur (le seul cas attendu ici) → backend interne direct
 *     (INTERNAL_API_URL ou 127.0.0.1:8000), comme lib/api/client.ts.
 *   - côté navigateur (fallback) → NEXT_PUBLIC_API_URL same-origin.
 * On NE passe PAS par apiFetch() : pas de header Authorization, pas de getSession().
 */
function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000"
  }
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
  return url
}

export const VerifiedDocumentSchema = z.object({
  valid: z.literal(true),
  document_type: z.string(),
  reference: z.string(),
  student_name: z.string(),
  class_name: z.string().nullable().default(null),
  academic_year: z.string().nullable().default(null),
  issued_at: z.string(),
  school_name: z.string(),
})

export type VerifiedDocument = z.infer<typeof VerifiedDocumentSchema>

export type VerifyResult =
  | { status: "valid"; document: VerifiedDocument }
  | { status: "not_found" }

/**
 * Interroge GET {BASE}/public/verify/{tenant}/{token} sans authentification.
 *
 * Tout statut non-200, toute réponse au shape inattendu, toute erreur réseau →
 * "not_found" (on traite un document non reconnu comme non authentique, jamais
 * comme une erreur affichée au visiteur).
 */
export async function verifyDocument(tenant: string, token: string): Promise<VerifyResult> {
  let res: Response
  try {
    res = await fetch(
      `${getBaseUrl()}/public/verify/${encodeURIComponent(tenant)}/${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    )
  } catch {
    return { status: "not_found" }
  }

  if (!res.ok) {
    return { status: "not_found" }
  }

  const json = (await res.json().catch(() => null)) as unknown
  const parsed = VerifiedDocumentSchema.safeParse(json)
  if (!parsed.success) {
    console.error("[verify] réponse inattendue du serveur:", parsed.error.issues)
    return { status: "not_found" }
  }

  return { status: "valid", document: parsed.data }
}

/**
 * Interroge GET {BASE}/public/verify-code/{tenant}/{code} sans authentification.
 *
 * Pendant que verifyDocument() vérifie via le token scanné (Datamatrix), cette
 * variante vérifie via le code CEV saisi manuellement (au dos du document). Le
 * contrat de réponse est IDENTIQUE : même validation Zod, même politique
 * d'échec. Tout statut non-200, tout shape inattendu, toute erreur réseau →
 * "not_found".
 */
export async function verifyDocumentByCode(tenant: string, code: string): Promise<VerifyResult> {
  let res: Response
  try {
    res = await fetch(
      `${getBaseUrl()}/public/verify-code/${encodeURIComponent(tenant)}/${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    )
  } catch {
    return { status: "not_found" }
  }

  if (!res.ok) {
    return { status: "not_found" }
  }

  const json = (await res.json().catch(() => null)) as unknown
  const parsed = VerifiedDocumentSchema.safeParse(json)
  if (!parsed.success) {
    console.error("[verify] réponse inattendue du serveur:", parsed.error.issues)
    return { status: "not_found" }
  }

  return { status: "valid", document: parsed.data }
}
