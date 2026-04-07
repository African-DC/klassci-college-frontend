export * from "./auth"
export * from "./attendance"
export * from "./enrollment"
export * from "./timetable"
export * from "./grade"
export * from "./fee"
export * from "./payment"
export * from "./council"
export * from "./bulletin"
export * from "./dren"
export * from "./settings"

// Shared pagination contract
import { z } from "zod"

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    size: z.number(),
  }).transform((val) => ({
    ...val,
    total_pages: val.size > 0 ? Math.ceil(val.total / val.size) : 1,
  }))

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  size: number
  total_pages: number
}
