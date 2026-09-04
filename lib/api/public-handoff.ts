import {
  PublicHandoffReceivedSchema,
  PublicHandoffViewSchema,
  type PublicHandoffView,
} from "@/lib/contracts/upload-handoff"

/**
 * Le côté téléphone de la reprise par code QR.
 *
 * Ces deux appels sont PUBLICS : pas de session, pas de cookie, pas
 * d'`Authorization`. Le téléphone n'a rien d'autre que le jeton du chemin, et
 * ce jeton ouvre exactement une session de dépôt, une fois, pendant dix
 * minutes. On ne passe donc SURTOUT pas par `apiFetch` — il appellerait
 * `getSession()` et déclencherait le contrat 401 sur une page où personne
 * n'est censé être connecté.
 *
 * Même forme que `lib/api/verify.ts`, la page publique voisine : résolution de
 * base identique, `fetch` nu, `cache: "no-store"`, validation Zod du corps.
 *
 * Ce que ce module ne fait pas : lever. Un téléphone en 3G qui coupe n'est pas
 * un incident, c'est le cas courant. Chaque appel rend un résultat qui dit
 * quoi afficher et si le même fichier peut repartir tel quel.
 */

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000"
  }
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
  return url
}

function chemin(tenant: string, token: string): string {
  return `/public/upload-handoff/${encodeURIComponent(tenant)}/${encodeURIComponent(token)}`
}

/** Le `detail` du backend, quand il en porte un de lisible. */
async function detailLisible(response: Response, repli: string): Promise<string> {
  const corps = (await response.json().catch(() => null)) as {
    detail?: unknown
  } | null
  const detail = corps?.detail
  return typeof detail === "string" && detail.trim() ? detail : repli
}

export type HandoffLookup =
  | { status: "ready"; view: PublicHandoffView }
  /** Jeton inconnu, expiré ou déjà consommé — le serveur ne les distingue pas. */
  | { status: "expired" }
  | { status: "unavailable" }

/**
 * Ce que le téléphone a le droit de savoir pour peindre sa page.
 *
 * Appelé côté serveur au rendu de la page : sur une connexion lente, la page
 * arrive peinte plutôt qu'en deux temps.
 */
export async function readHandoff(tenant: string, token: string): Promise<HandoffLookup> {
  let response: Response
  try {
    response = await fetch(`${getBaseUrl()}${chemin(tenant, token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
  } catch {
    return { status: "unavailable" }
  }

  if (response.status === 404) return { status: "expired" }
  if (!response.ok) return { status: "unavailable" }

  const json = (await response.json().catch(() => null)) as unknown
  const lu = PublicHandoffViewSchema.safeParse(json)
  if (!lu.success) {
    console.error("[handoff] réponse inattendue du serveur:", lu.error.issues)
    return { status: "unavailable" }
  }
  return { status: "ready", view: lu.data }
}

export type DepositOutcome =
  | { status: "sent" }
  /**
   * `retryable` : le même fichier peut repartir tel quel, sans rescanner le
   * code — c'est la promesse tenue à quelqu'un dont la donnée mobile coupe en
   * plein envoi. À faux, il faut reprendre la photo ou revenir à l'ordinateur.
   */
  | { status: "failed"; message: string; retryable: boolean }

/** Quarante-cinq secondes : au-delà, en 3G, l'envoi est perdu, pas lent. */
const DELAI_MAX_MS = 45_000

/**
 * Dépose le fichier dans le sas. Aucune fiche n'est écrite : c'est l'opérateur
 * qui décidera, sur son écran, et la page le dit dans ces mots-là.
 */
export async function depositHandoffFile(
  tenant: string,
  token: string,
  file: File,
): Promise<DepositOutcome> {
  const corps = new FormData()
  corps.append("file", file)

  const abandon = new AbortController()
  const echeance = setTimeout(() => abandon.abort(), DELAI_MAX_MS)

  let response: Response
  try {
    response = await fetch(`${getBaseUrl()}${chemin(tenant, token)}`, {
      method: "POST",
      body: corps,
      cache: "no-store",
      signal: abandon.signal,
    })
  } catch {
    return {
      status: "failed",
      message: abandon.signal.aborted
        ? "L'envoi a été trop long. Rapprochez-vous du réseau, puis réessayez."
        : "La connexion s'est interrompue. La photo est toujours là : réessayez.",
      retryable: true,
    }
  } finally {
    clearTimeout(echeance)
  }

  if (response.ok) {
    const json = (await response.json().catch(() => null)) as unknown
    const lu = PublicHandoffReceivedSchema.safeParse(json)
    if (!lu.success) {
      console.error("[handoff] réponse inattendue du serveur:", lu.error.issues)
      return {
        status: "failed",
        message: "Réponse inattendue du serveur. Vérifiez sur l'ordinateur avant de renvoyer.",
        retryable: false,
      }
    }
    return { status: "sent" }
  }

  if (response.status === 404) {
    return {
      status: "failed",
      message: "Ce lien n'est plus valable. Demandez un nouveau code sur l'ordinateur.",
      retryable: false,
    }
  }
  if (response.status === 409) {
    return {
      status: "failed",
      message:
        "Une photo est déjà partie pour ce code. Regardez l'ordinateur : il faut y demander « Reprendre » avant d'en envoyer une autre.",
      retryable: false,
    }
  }
  if (response.status === 429 || response.status === 503) {
    return {
      status: "failed",
      message: await detailLisible(response, "Service momentanément indisponible. Réessayez."),
      retryable: true,
    }
  }
  if (response.status >= 500) {
    return {
      status: "failed",
      message: "Le serveur n'a pas pu recevoir la photo. Réessayez.",
      retryable: true,
    }
  }
  return {
    status: "failed",
    message: await detailLisible(response, "Cette photo n'a pas été acceptée. Reprenez-la."),
    retryable: false,
  }
}
