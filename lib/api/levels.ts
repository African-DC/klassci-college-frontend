import { LevelSchema } from "@/lib/contracts/level"
import type { Level, LevelCreate, LevelUpdate } from "@/lib/contracts/level"
import { createCrudApi } from "./createCrudApi"

export const levelsApi = createCrudApi<Level, LevelCreate, LevelUpdate>(
  "/levels",
  LevelSchema,
)
