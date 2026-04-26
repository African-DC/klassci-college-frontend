import { z } from "zod"

export const LevelSchema = z.object({
  id: z.number(),
  name: z.string(),
  order: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const LevelCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  order: z.number({ required_error: "L'ordre est requis" }).int().positive("L'ordre doit être positif"),
})

export const LevelUpdateSchema = LevelCreateSchema.partial()

export type Level = z.infer<typeof LevelSchema>
export type LevelCreate = z.infer<typeof LevelCreateSchema>
export type LevelUpdate = z.infer<typeof LevelUpdateSchema>
