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
  return `/admin/${ARCHIVABLE_ENTITIES[entity].path}/${id}`
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
   * Le motif voyage en paramètre d'URL, pas dans un corps : c'est le contrat
   * du backend pour un DELETE. Il est encodé, un motif contenant « & » ou un
   * accent ne doit pas casser la requête ni tronquer la justification.
   */
  purge: async (entity: ArchivableEntity, id: number, reason: string): Promise<void> => {
    const params = new URLSearchParams({ reason })
    await apiFetch<unknown>(`${basePath(entity, id)}?${params.toString()}`, {
      method: "DELETE",
    })
  },
}
