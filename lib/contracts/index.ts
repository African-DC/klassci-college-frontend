export * from "./auth"
export * from "./enrollment"
export * from "./timetable"
export * from "./grade"

// Shared pagination contract
import { z } from "zod"

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    per_page: z.number(),
    total_pages: z.number(),
  })

const _basePaginatedSchema = PaginatedResponseSchema(z.unknown())
type _BasePaginated = z.infer<typeof _basePaginatedSchema>
export type PaginatedResponse<T> = Omit<_BasePaginated, "data"> & { data: T[] }
