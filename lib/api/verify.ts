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

const DocumentStatusSchema = z.enum(["active", "revoked", "superseded", "expired"])

export const VerifiedDocumentSchema = z.object({
  valid: z.boolean(),
  status: DocumentStatusSchema,
  scheme: z.string(),
  document_type: z.string(),
  issued_at: z.string(),
  expires_at: z.string().nullable().default(null),
  school_name: z.string(),
  signature_algorithm: z.string().nullable().default(null),
  key_id: z.string().nullable().default(null),
  file_verification_available: z.boolean().default(false),
}).strict()

export type VerifiedDocument = z.infer<typeof VerifiedDocumentSchema>

export type VerifyResult =
  | { status: "recognized"; document: VerifiedDocument }
  | { status: "not_found" }
  | { status: "unavailable" }

const FileVerificationSchema = z.discriminatedUnion("status", [
  z
    .object({
      valid: z.boolean(),
      matches: z.boolean(),
      status: z.literal("matching"),
      signature_valid: z.boolean(),
      document_status: DocumentStatusSchema,
    })
    .strict(),
  z
    .object({
      valid: z.boolean(),
      matches: z.boolean(),
      status: z.literal("modified"),
      signature_valid: z.boolean(),
      document_status: DocumentStatusSchema,
    })
    .strict(),
  z
    .object({
      valid: z.literal(false),
      matches: z.literal(false),
      status: z.literal("unavailable"),
      code: z.literal("FILE_VERIFICATION_UNAVAILABLE"),
      signature_valid: z.boolean(),
      document_status: DocumentStatusSchema,
    })
    .strict(),
])

export type FileVerificationResult = z.infer<typeof FileVerificationSchema>

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
    return { status: "unavailable" }
  }

  if (res.status === 404) return { status: "not_found" }
  if (!res.ok) {
    return { status: "unavailable" }
  }

  const json = (await res.json().catch(() => null)) as unknown
  const parsed = VerifiedDocumentSchema.safeParse(json)
  if (!parsed.success) {
    console.error("[verify] réponse inattendue du serveur:", parsed.error.issues)
    return { status: "unavailable" }
  }

  return { status: "recognized", document: parsed.data }
}

/**
 * Interroge GET {BASE}/public/verify-code/{tenant}/{code} sans authentification.
 *
 * Pendant que verifyDocument() vérifie via le token scanné (Datamatrix), cette
 * variante vérifie via le code du sceau saisi manuellement. Le
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
    return { status: "unavailable" }
  }

  if (res.status === 404) return { status: "not_found" }
  if (!res.ok) {
    return { status: "unavailable" }
  }

  const json = (await res.json().catch(() => null)) as unknown
  const parsed = VerifiedDocumentSchema.safeParse(json)
  if (!parsed.success) {
    console.error("[verify] réponse inattendue du serveur:", parsed.error.issues)
    return { status: "unavailable" }
  }

  return { status: "recognized", document: parsed.data }
}

export async function verifyDocumentFile(
  tenant: string,
  file: File,
  identifier: { token: string } | { sealCode: string },
): Promise<FileVerificationResult | null> {
  const endpoint =
    "token" in identifier
      ? `/public/verify-file/${encodeURIComponent(tenant)}/${encodeURIComponent(identifier.token)}`
      : `/public/verify-file-code/${encodeURIComponent(tenant)}/${encodeURIComponent(identifier.sealCode)}`
  const formData = new FormData()
  formData.append("document", file)

  try {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    })
    if (!response.ok && response.status !== 409) return null
    const json = (await response.json().catch(() => null)) as unknown
    const parsed = FileVerificationSchema.safeParse(json)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
