import { z } from "zod"

export const ClassRosterStudentSchema = z.object({
  enrollment_number: z.string(), first_name: z.string(), last_name: z.string(),
  genre: z.enum(["M", "F"]).nullish(), birth_date: z.string().nullish(),
  birth_place: z.string().nullish(), nationality: z.string().nullish(),
  photo_url: z.string().nullish(), parent_phone: z.string().nullish(),
  is_repeater: z.boolean().nullish(), is_new_student: z.boolean().nullish(),
  assignment_status: z.enum(["affecte", "reaffecte", "non_affecte"]).nullish(),
})
export const ClassRosterDataSchema = z.object({
  class_name: z.string(), academic_year_name: z.string(),
  students: z.array(ClassRosterStudentSchema), total: z.number(),
})
export type ClassRosterData = z.infer<typeof ClassRosterDataSchema>
export type AssignmentStatus = "affecte" | "reaffecte" | "non_affecte"
export interface ClassRosterFilters {
  genre?: "M" | "F"
  age_min?: number
  age_max?: number
  nationalities?: string[]
  assignment_statuses?: AssignmentStatus[]
  is_repeater?: boolean
  is_new_student?: boolean
}
