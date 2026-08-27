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
   * Vrai quand ni la date ni le lieu de naissance n'étaient disponibles.
   *
   * Le score ne porte alors que sur le nom et le prénom. L'écran doit le dire :
   * un « 96 % » obtenu sur deux champs n'a pas la valeur d'un « 96 % » obtenu
   * sur quatre, et les fiches reprises de l'ancien système sont toutes dans ce
   * cas.
   */
  juge_sur_peu: z.boolean(),
  inscription_annee_courante: InscriptionExistanteSchema.nullable(),
})

export const DoublonsSchema = z.object({
  correspondances: z.array(CorrespondanceSchema),
  total: z.number(),
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
  birth_place?: string
  enrollment_number?: string
  academic_year_id?: number
  ignorer_student_id?: number
}
