import { z } from "zod"

/** L'inscription déjà ouverte pour l'année visée, validée ou non. */
export const InscriptionExistanteSchema = z.object({
  enrollment_id: z.number(),
  status: z.string(),
  class_name: z.string().nullable(),
})

export const CorrespondanceSchema = z.object({
  student_id: z.number(),
  last_name: z.string(),
  first_name: z.string(),
  enrollment_number: z.string().nullable(),
  birth_date: z.string().nullable(),
  /** « matricule » (certain) ou « ressemblance ». */
  motif: z.enum(["matricule", "ressemblance"]),
  score: z.number().nullable(),
  /**
   * Vrai quand un des champs d'état civil n'a pas pu être comparé.
   *
   * Le score ne porte alors que sur une partie de l'identité. Les fiches
   * reprises de l'ancien système sont toutes dans ce cas : sans cette
   * réserve, un « 100 % » obtenu sur le seul nom se lirait comme une
   * correspondance complète.
   */
  juge_sur_peu: z.boolean(),
  inscription_annee_courante: InscriptionExistanteSchema.nullable(),
})

export const DoublonsSchema = z.object({
  correspondances: z.array(CorrespondanceSchema),
  /**
   * Vrai quand le plafond de candidats a été atteint.
   *
   * Sans ce signal, « rien trouvé » se lit comme une certitude alors que la
   * recherche s'est arrêtée avant d'avoir tout regardé.
   */
  tronque: z.boolean(),
})

export type Correspondance = z.infer<typeof CorrespondanceSchema>
export type Doublons = z.infer<typeof DoublonsSchema>

export interface DoublonsParams {
  last_name?: string
  first_name?: string
  birth_date?: string
  enrollment_number?: string
  academic_year_id?: number
  ignorer_student_id?: number
}
