import { z } from "zod"
import { AssignmentStatusSchema } from "./enrollment"
import {
  ArtisticDisciplineSchema,
  Lv2Schema,
  PreviousLevelSchema,
  ScholarshipKindSchema,
} from "./enrollment-profile"

// Miroir de GET /classes/{id}/information-sheet et GET /information-sheet.
// Une ligne par inscription active, triée par nom puis prénoms côté serveur.

export const InformationSheetRowSchema = z.object({
  enrollment_id: z.number(),
  matricule: z.string().nullable(),
  last_name: z.string(),
  first_name: z.string(),
  genre: z.enum(["M", "F"]).nullable(),
  level_name: z.string().nullable(),
  birth_date: z.string().nullable(),
  birth_place: z.string().nullable(),
  nationality: z.string().nullable(),
  assignment_status: AssignmentStatusSchema.nullable(),
  scholarship_kind: ScholarshipKindSchema.nullable(),
  is_repeater: z.boolean().nullable(),
  lv2: Lv2Schema.nullable(),
  artistic_discipline: ArtisticDisciplineSchema.nullable(),
  has_photo: z.boolean(),
  previous_level: PreviousLevelSchema.nullable(),
  previous_series: z.string().nullable(),
})

export const InformationSheetClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  level_name: z.string().nullable(),
  rows: z.array(InformationSheetRowSchema),
})

export const InformationSheetSchema = z.object({
  academic_year: z.object({ id: z.number(), name: z.string() }),
  classes: z.array(InformationSheetClassSchema),
})

export type InformationSheetRow = z.infer<typeof InformationSheetRowSchema>
export type InformationSheetClass = z.infer<typeof InformationSheetClassSchema>
export type InformationSheet = z.infer<typeof InformationSheetSchema>
