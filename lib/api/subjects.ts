import { SubjectSchema } from "@/lib/contracts/subject"
import type { Subject, SubjectCreate, SubjectUpdate } from "@/lib/contracts/subject"
import { createCrudApi } from "./createCrudApi"

export const subjectsApi = createCrudApi<Subject, SubjectCreate, SubjectUpdate>(
  "/subjects",
  SubjectSchema,
)
