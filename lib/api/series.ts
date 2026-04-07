import { SeriesSchema } from "@/lib/contracts/series"
import type { Series, SeriesCreate, SeriesUpdate } from "@/lib/contracts/series"
import { createCrudApi } from "./createCrudApi"

export const seriesApi = createCrudApi<Series, SeriesCreate, SeriesUpdate>(
  "/series",
  SeriesSchema,
)
