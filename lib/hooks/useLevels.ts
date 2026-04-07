"use client"

import { levelsApi } from "@/lib/api/levels"
import type { Level, LevelCreate, LevelUpdate } from "@/lib/contracts/level"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: levelKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Level, LevelCreate, LevelUpdate>("levels", levelsApi, {
  created: "Niveau cree avec succes",
  updated: "Niveau mis a jour",
  deleted: "Niveau supprime",
})

export { levelKeys }
export const useLevels = useList
export const useLevel = useDetail
export const useCreateLevel = useCreate
export const useUpdateLevel = useUpdate
export const useDeleteLevel = useDelete
