import { ClassSchema } from "@/lib/contracts/class"
import type { Class, ClassCreate, ClassUpdate } from "@/lib/contracts/class"
import { createCrudApi } from "./createCrudApi"

export const classesApi = createCrudApi<Class, ClassCreate, ClassUpdate>(
  "/admin/classes",
  ClassSchema,
)
