import { getSession, signOut } from "next-auth/react"
import type { Session } from "next-auth"
import type { z } from "zod"

function getBaseUrl(): string {
  // Server-side (route handlers / RSC): call the backend directly so auth and
  // server fetches never depend on the public host's DNS/TLS (no hairpin,
  // no host-pinning). Falls back to the internal address.
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000"
  }
  // Client-side: same-origin relative base → works on whatever host the app is
  // served from (https domain, raw IP in http, …). No mixed-content, no CORS.
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
  return url
}

// Idempotent flag: when several queries fire in parallel and all return
// 401 because the JWT just expired, we want exactly one signOut + redirect
// — not N. Reset on next module load (full page reload after redirect).
let isHandlingExpiredSession = false

export async function handleExpiredSession(): Promise<void> {
  if (isHandlingExpiredSession) return
  if (typeof window === "undefined") return
  isHandlingExpiredSession = true
  // Invalidate the session cache so subsequent fetches don't pick up
  // the stale token before the redirect happens.
  sessionCache = null
  sessionPromise = null
  // Best-effort toast. Sonner may not be mounted yet on initial render.
  try {
    const { toast } = await import("sonner")
    toast.error("Session expirée", {
      description: "Veuillez vous reconnecter pour continuer.",
    })
  } catch {
    // ignore
  }
  // Belt-and-suspenders: even if signOut hangs or rejects, the redirect
  // must fire — otherwise we get the zombie state observed 2026-05-20
  // (28×401 with the session-token cookie still set, no redirect, UI
  // stays mounted on /admin/*).
  const redirect = () => {
    window.location.href = "/login?expired=1"
  }
  const fallback = window.setTimeout(redirect, 1500)
  try {
    await signOut({ redirect: false })
  } catch {
    // ignore — we redirect regardless
  } finally {
    window.clearTimeout(fallback)
    redirect()
  }
}

interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>
  schema?: z.ZodType
}

/**
 * Valide une reponse, et rend ce que le schema produit — pas ce qu'il accepte.
 *
 * La signature disait `z.ZodType<T>`, dont le parametre d'entree vaut `T` par
 * defaut : TypeScript inferait donc `T` sur le cote **entree** du schema. Des
 * qu'un champ portait un `.default()`, il devenait facultatif a l'entree, et le
 * type rendu ici n'etait plus celui que le schema garantit — l'appelant qui
 * annoncait le bon type se faisait refuser sa propre valeur.
 *
 * `z.infer` designe la sortie, c'est-a-dire ce qui existe reellement apres
 * validation, defauts appliques. C'est ce que `api-client-zod-validation.md`
 * demande depuis toujours en recommandant `.array().default([])` : la regle
 * etait juste, l'outil ne la suivait pas.
 */
export function safeValidate<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
  context: string,
): z.infer<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error(`[API] Validation failed for ${context}:`, result.error.issues)
    throw new Error(`Réponse inattendue du serveur pour ${context}`)
  }
  return result.data
}

// Cache getSession() to avoid redundant /api/auth/session round-trips
// when multiple TanStack Query fetches fire in parallel on mount.
const SESSION_CACHE_TTL = 10_000 // 10 seconds — short enough to catch token refresh
let sessionCache: { session: Session | null; timestamp: number } | null = null
let sessionPromise: Promise<Session | null> | null = null

async function getCachedSession(): Promise<Session | null> {
  if (sessionCache && Date.now() - sessionCache.timestamp < SESSION_CACHE_TTL) {
    return sessionCache.session
  }
  // Deduplicate concurrent calls — all parallel fetches share one getSession() call
  if (!sessionPromise) {
    sessionPromise = getSession().then((session) => {
      sessionCache = { session, timestamp: Date.now() }
      sessionPromise = null
      return session
    })
  }
  return sessionPromise
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getCachedSession()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  // auth.ts sets session.error = "RefreshTokenError" when isTokenExpired() is
  // truthy on the next jwt() pass, but it still exposes session.accessToken
  // (the stale JWT). Don't send that to the BE: bail out and trigger the
  // signOut/redirect flow immediately. Middleware would catch it on the next
  // server navigation, but client-side fetches need their own handler.
  if (session?.error === "RefreshTokenError") {
    void handleExpiredSession()
    throw new Error("Session expirée")
  }
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`
  }
  return headers
}

/** Fetch authentifié retournant un Blob (pour téléchargement PDF, Excel, etc.) */
/**
 * Erreur HTTP portant le `detail` du backend tel quel.
 *
 * FastAPI renvoie soit une chaine (`{detail: "..."}`), soit un objet quand le
 * front doit pouvoir agir dessus, par exemple un montant a payer et le droit
 * de deroger. On garde l'objet intact ici : le client HTTP n'a pas a connaitre
 * la semantique de chaque code, chaque module la lit lui-meme.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function apiErrorFrom(status: number, detail: unknown, fallback: string): ApiError {
  if (typeof detail === "string") return new ApiError(detail, status, detail)
  if (detail !== null && typeof detail === "object") {
    const message = (detail as { message?: unknown }).message
    return new ApiError(typeof message === "string" ? message : fallback, status, detail)
  }
  return new ApiError(fallback, status, detail)
}

/**
 * Contrat 401 unique, partagé par tous les fetchs authentifiés de ce module
 * (voir `.claude/rules/handle-401-globally.md`).
 *
 * `hadToken` porte sur l'en-tête réellement envoyé, jamais sur une relecture de
 * la session : juste après le login, le cookie est posé mais `getSession()`
 * n'est pas encore amorcé, la première requête part donc sans `Authorization`
 * et un 401 ne doit surtout pas déconnecter l'utilisateur qui vient d'entrer.
 * Le middleware redirige à la navigation suivante. Relire la session ici
 * rejouerait aussi la course avec `handleExpiredSession()` qui vide le cache.
 */
function throwIfSessionExpired(res: Response, hadToken: boolean): void {
  if (res.status !== 401) return
  if (hadToken) {
    void handleExpiredSession()
  }
  throw new Error("Session expirée")
}

/**
 * Message lisible tiré du corps d'erreur FastAPI : `detail` est une chaine, ou
 * un tableau d'erreurs de validation pour un 422.
 */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { detail?: unknown } | null
  const detail = body?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d: { msg?: string; loc?: string[] }) => d.msg ?? JSON.stringify(d)).join(", ")
  }
  return fallback
}

interface BlobRequestOptions {
  method?: string
  /** Corps JSON déjà sérialisé. Sa présence conserve le Content-Type. */
  body?: string
}

/**
 * Certains documents sont délivrés par un POST et non un GET : le billet
 * d'entrée ferme l'absence dans le cahier d'appel en même temps qu'il
 * s'imprime. Le verbe et le corps sont donc paramétrables, le contrat 401 et
 * la lecture du `detail` backend restent les mêmes.
 */
export async function apiFetchBlob(
  path: string,
  options: BlobRequestOptions = {},
): Promise<Blob> {
  const headers = await authHeaders()
  if (options.body === undefined) delete headers["Content-Type"]
  const hadToken = "Authorization" in headers
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    body: options.body,
    headers,
  })
  throwIfSessionExpired(res, hadToken)
  if (!res.ok) {
    // Surface the BE detail when available so the caller can toast a useful
    // message — see app/routers/_pdf_helpers.py for the JSON {detail} contract.
    const contentType = res.headers.get("content-type") ?? ""
    const fallback = `Erreur ${res.status} lors du téléchargement`
    if (contentType.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as { detail?: unknown } | null
      if (body?.detail) throw apiErrorFrom(res.status, body.detail, fallback)
    }
    throw new Error(fallback)
  }
  return res.blob()
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { schema, ...fetchOptions } = options
  const headers = { ...(await authHeaders()), ...fetchOptions.headers }
  const hadToken = "Authorization" in headers
  const res = await fetch(`${getBaseUrl()}${path}`, { ...fetchOptions, headers })

  throwIfSessionExpired(res, hadToken)

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Erreur ${res.status}`))
  }

  if (res.status === 204) return undefined as T
  const data = await res.json()
  return schema ? safeValidate(schema, data, path) : data
}

interface MultipartRequestOptions<T> {
  /** Verbe HTTP, `POST` par défaut. */
  method?: string
  /** Schéma Zod de la réponse JSON, quand la réponse en porte une. */
  schema?: z.ZodType<T>
  /** Étiquette de validation, ex. `"POST /admin/settings/logo"`. `path` par défaut. */
  context?: string
  /** Message affiché quand le backend ne renvoie pas de `detail` exploitable. */
  fallback?: string
}

/**
 * Fetch authentifié multipart, pour tout envoi de fichier (photo, logo, pièce
 * jointe).
 *
 * `apiFetch` sérialise en JSON et pose `Content-Type: application/json` : il est
 * inutilisable ici, car sur un `FormData` c'est le navigateur qui doit poser
 * lui-même le Content-Type avec sa frontière multipart. C'est la SEULE
 * différence : en-tête `Authorization`, contrat 401 et lecture du `detail`
 * backend restent ceux de `apiFetch`. Un module d'upload n'a donc plus à
 * réimplémenter le contrat de `.claude/rules/handle-401-globally.md` de son
 * côté, ce que trois d'entre eux avaient fini par faire chacun à sa façon.
 */
export async function apiFetchMultipart<T>(
  path: string,
  formData: FormData,
  options: MultipartRequestOptions<T> = {},
): Promise<T> {
  const { method, schema, context, fallback } = options
  const headers = await authHeaders()
  delete headers["Content-Type"]
  const hadToken = "Authorization" in headers
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: method ?? "POST",
    headers,
    body: formData,
  })

  throwIfSessionExpired(res, hadToken)

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, fallback ?? `Erreur ${res.status}`))
  }

  if (res.status === 204) return undefined as T
  const data = await res.json()
  return schema ? safeValidate(schema, data, context ?? path) : (data as T)
}
