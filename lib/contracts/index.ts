export * from "./auth"
export * from "./enrollment"
export * from "./timetable"
export * from "./grade"
export * from "./student"
export * from "./teacher"
export * from "./class"
export * from "./notification"

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

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
