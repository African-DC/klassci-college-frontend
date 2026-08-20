import { z } from "zod"

/**
 * La corbeille de l'établissement : tout ce qui a été retiré des écrans sans
 * être détruit.
 *
 * Le backend est en cours de livraison : chaque champ non structurant est
 * `.nullish()`. Une fiche archivée dont le motif ou l'auteur manquerait à
 * l'exécution doit s'afficher dégradée, jamais faire tomber l'écran, sinon la
 * seule porte de sortie d'un archivage accidentel se referme.
 */
export const ArchiveEntrySchema = z.object({
  entity_type: z.string(),
  entity_id: z.number(),
  label: z.string().nullish(),
  archived_at: z.string().nullish(),
  archived_by: z.number().nullish(),
  archived_by_name: z.string().nullish(),
  archive_reason: z.string().nullish(),
})

export const ArchiveListSchema = z.object({
  items: z.array(ArchiveEntrySchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
})

export type ArchiveEntry = z.infer<typeof ArchiveEntrySchema>
export type ArchiveList = z.infer<typeof ArchiveListSchema>

export interface ArchiveQuery {
  entity_type?: string
  page?: number
  size?: number
}

/**
 * Les familles d'objets archivables et leur route backend.
 *
 * Le type d'entité renvoyé par la corbeille commande l'URL d'appel : on ne
 * devine pas un chemin en collant un « s » derrière le type, une faute de
 * pluriel enverrait une purge sur la mauvaise ressource.
 *
 * `apiBase` porte le chemin complet, préfixe compris, parce qu'il n'est pas
 * uniforme : les personnes vivent sous `/admin`, les inscriptions non. Le
 * reconstruire à partir d'un préfixe commun enverrait les inscriptions sur une
 * route qui n'existe pas.
 *
 * `deletePermission` est le droit exigé par le backend pour archiver ou
 * restaurer. On le déclare ici pour que le bouton et l'appel parlent du même
 * droit : un bouton visible qui finit en 403 est pire que pas de bouton.
 */
export const ARCHIVABLE_ENTITIES = {
  student: {
    apiBase: "/admin/students",
    label: "Élève",
    plural: "Élèves",
    queryKey: "students",
    deletePermission: "admin:students:delete",
  },
  parent: {
    apiBase: "/admin/parents",
    label: "Parent",
    plural: "Parents",
    queryKey: "parents",
    deletePermission: "admin:parents:delete",
  },
  teacher: {
    apiBase: "/admin/teachers",
    label: "Enseignant",
    plural: "Enseignants",
    queryKey: "teachers",
    deletePermission: "admin:teachers:delete",
  },
  staff: {
    apiBase: "/admin/staff",
    label: "Personnel",
    plural: "Personnel",
    queryKey: "staff",
    deletePermission: "admin:staff:delete",
  },
  enrollment: {
    apiBase: "/enrollments",
    label: "Inscription",
    plural: "Inscriptions",
    queryKey: "enrollments",
    deletePermission: "enrollments:delete",
  },
} as const

export type ArchivableEntity = keyof typeof ARCHIVABLE_ENTITIES

export function isArchivableEntity(value: string): value is ArchivableEntity {
  return Object.hasOwn(ARCHIVABLE_ENTITIES, value)
}

/** Le motif part au journal et par courriel : trop court, il n'explique rien. */
export const ARCHIVE_REASON_MIN_LENGTH = 10

/** Personnes physiques : sert au décompte « dont personnes » de la corbeille. */
export const PERSON_ENTITIES: readonly string[] = ["parent", "teacher", "staff"]
