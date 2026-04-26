import { z } from "zod"

export const SeriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  level_id: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const SeriesCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  level_id: z.number({ required_error: "Le niveau est requis" }).positive("Le niveau est requis"),
})

export const SeriesUpdateSchema = SeriesCreateSchema.partial()

export type Series = z.infer<typeof SeriesSchema>
export type SeriesCreate = z.infer<typeof SeriesCreateSchema>
export type SeriesUpdate = z.infer<typeof SeriesUpdateSchema>
