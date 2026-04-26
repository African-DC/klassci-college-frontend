import { z } from "zod"

export const AcademicYearSchema = z.object({
  id: z.number(),
  name: z.string(),
  label: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
  is_current: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const AcademicYearCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  start_date: z.string({ required_error: "La date de début est requise" }).min(1, "La date de début est requise"),
  end_date: z.string({ required_error: "La date de fin est requise" }).min(1, "La date de fin est requise"),
  is_current: z.boolean().default(false),
})

export const AcademicYearUpdateSchema = AcademicYearCreateSchema.partial()

export type AcademicYear = z.infer<typeof AcademicYearSchema>
export type AcademicYearCreate = z.infer<typeof AcademicYearCreateSchema>
export type AcademicYearUpdate = z.infer<typeof AcademicYearUpdateSchema>
