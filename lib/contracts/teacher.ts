import { z } from "zod"

// Type de contrat tel que la DRENA le distingue (miroir de l'enum
// TeacherContract côté backend). Alimente les tableaux 18 à 21 du rapport de
// fin de trimestre de la DEEP : sans cette information, ils sortent vierges.
export const TEACHER_CONTRACT_OPTIONS = [
  { value: "permanent", label: "Permanent" },
  { value: "vacataire", label: "Vacataire" },
  { value: "fonctionnaire", label: "Fonctionnaire" },
] as const

export const TEACHER_GENRE_OPTIONS = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Féminin" },
] as const

const TEACHER_CONTRACT_LABELS: Record<string, string> = Object.fromEntries(
  TEACHER_CONTRACT_OPTIONS.map((option) => [option.value, option.label]),
)

const TEACHER_GENRE_LABELS: Record<string, string> = Object.fromEntries(
  TEACHER_GENRE_OPTIONS.map((option) => [option.value, option.label]),
)

/** Libellé français du type de contrat, `null` tant qu'il n'est pas renseigné. */
export function teacherContractLabel(contract?: string | null): string | null {
  if (!contract) return null
  return TEACHER_CONTRACT_LABELS[contract] ?? contract
}

/** Libellé français du sexe, `null` tant qu'il n'est pas renseigné. */
export function teacherGenreLabel(genre?: string | null): string | null {
  if (!genre) return null
  return TEACHER_GENRE_LABELS[genre] ?? genre
}

const TeacherGenreEnum = z.enum(["M", "F"])
const TeacherContractEnum = z.enum(["permanent", "vacataire", "fonctionnaire"])

export const TeacherSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  speciality: z.string().nullable(),
  phone: z.string().nullish(),
  genre: TeacherGenreEnum.nullish(),
  contract_type: TeacherContractEnum.nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const TeacherCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1, "Le prénom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  email: z.string({ required_error: "L'email est requis" }).email("Email invalide"),
  password: z.string({ required_error: "Le mot de passe est requis" }).min(8, "8 caractères minimum"),
  speciality: z.string().optional(),
  phone: z.string().optional(),
  genre: TeacherGenreEnum.optional(),
  contract_type: TeacherContractEnum.optional(),
})

export const TeacherUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  speciality: z.string().optional(),
  phone: z.string().optional(),
  genre: TeacherGenreEnum.optional(),
  contract_type: TeacherContractEnum.optional(),
})

export const TeacherListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
})

export type Teacher = z.infer<typeof TeacherSchema>
export type TeacherCreate = z.infer<typeof TeacherCreateSchema>
export type TeacherUpdate = z.infer<typeof TeacherUpdateSchema>
export type TeacherListParams = z.infer<typeof TeacherListParamsSchema>
