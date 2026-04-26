"use client"

import { seriesApi } from "@/lib/api/series"
import type { Series, SeriesCreate, SeriesUpdate } from "@/lib/contracts/series"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: seriesKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Series, SeriesCreate, SeriesUpdate>("series", seriesApi, {
  created: "Serie creee avec succes",
  updated: "Serie mise a jour",
  deleted: "Serie supprimee",
})

export { seriesKeys }
export const useSeriesList = useList
export const useSeriesDetail = useDetail
export const useCreateSeries = useCreate
export const useUpdateSeries = useUpdate
export const useDeleteSeries = useDelete
