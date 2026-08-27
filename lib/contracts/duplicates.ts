import { z } from "zod"

/** L'inscription déjà ouverte pour l'année visée, validée ou non. */
export const ExistingEnrollmentSchema = z.object({
  enrollment_id: z.number(),
  status: z.string(),
  class_name: z.string().nullable(),
})

export const MatchSchema = z.object({
  student_id: z.number(),
  last_name: z.string(),
  first_name: z.string(),
  enrollment_number: z.string().nullable(),
  birth_date: z.string().nullable(),
  /** Certitude (matricule identique) ou ressemblance de l'état civil. */
  reason: z.enum(["enrollment_number", "similarity"]),
  score: z.number().nullable(),
  /**
   * Vrai quand un des champs d'état civil n'a pas pu être comparé.
   *
   * Le score ne porte alors que sur une partie de l'identité. Les fiches
   * reprises de l'ancien système sont toutes dans ce cas : sans cette
   * réserve, un « 100 % » obtenu sur le seul nom se lirait comme une
   * correspondance complète.
   */
  partial_identity: z.boolean(),
  current_year_enrollment: ExistingEnrollmentSchema.nullable(),
})

export const DuplicatesSchema = z.object({
  matches: z.array(MatchSchema),
  /**
   * Vrai quand le plafond de candidats a été atteint.
   *
   * Sans ce signal, « rien trouvé » se lit comme une certitude alors que la
   * recherche s'est arrêtée avant d'avoir tout regardé.
   */
  truncated: z.boolean(),
})

export type Match = z.infer<typeof MatchSchema>
export type Duplicates = z.infer<typeof DuplicatesSchema>

export interface DuplicatesParams {
  last_name?: string
  first_name?: string
  birth_date?: string
  enrollment_number?: string
  academic_year_id?: number
  exclude_student_id?: number
}
