import {
  ARCHIVABLE_ENTITIES,
  ArchiveListSchema,
  type ArchivableEntity,
  type ArchiveList,
  type ArchiveQuery,
} from "@/lib/contracts/archive"
import { apiFetch, safeValidate } from "./client"

function toSearchParams(query: ArchiveQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/**
 * Le backend peut renvoyer la page telle quelle ou l'emballer dans `{data}`.
 * On déballe avant de valider : sinon le schéma échoue sur une enveloppe et
 * l'écran affiche une erreur alors que les données sont là.
 */
function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.items !== undefined) return obj
    if (obj.data !== undefined) return obj.data
  }
  return json
}

function basePath(entity: ArchivableEntity, id: number): string {
  // Le préfixe vient du catalogue, il n'est pas déductible : les inscriptions
  // sont servies hors de `/admin`, contrairement aux personnes.
  return `${ARCHIVABLE_ENTITIES[entity].apiBase}/${id}`
}

export const archiveApi = {
  /** La corbeille, paginée, éventuellement restreinte à un type de fiche. */
  list: async (query: ArchiveQuery = {}): Promise<ArchiveList> => {
    const json = await apiFetch<unknown>(`/admin/archive${toSearchParams(query)}`)
    return safeValidate(ArchiveListSchema, unwrap(json), "GET /admin/archive")
  },

  /** Retire la fiche des écrans sans rien détruire. Le motif part au journal. */
  archive: async (entity: ArchivableEntity, id: number, reason: string): Promise<void> => {
    await apiFetch<unknown>(`${basePath(entity, id)}/archive`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },

  /** Remet la fiche en circulation. Réparer ne demande pas de justification. */
  restore: async (entity: ArchivableEntity, id: number): Promise<void> => {
    await apiFetch<unknown>(`${basePath(entity, id)}/restore`, { method: "POST" })
  },

  /**
   * Suppression définitive, sans retour possible.
   *
   * Le motif voyage dans le corps, jamais dans l'URL : une URL finit dans les
   * journaux d'accès du serveur et chez les intermédiaires, et « exclu pour
   * vol » n'a rien à y faire.
   */
  purge: async (entity: ArchivableEntity, id: number, reason: string): Promise<void> => {
    await apiFetch<unknown>(basePath(entity, id), {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    })
  },
}
