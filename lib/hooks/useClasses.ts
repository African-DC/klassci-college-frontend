"use client"

import { classesApi } from "@/lib/api/classes"
import type { Class, ClassCreate, ClassUpdate } from "@/lib/contracts/class"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: classKeys,
  useList,
  useInfiniteList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Class, ClassCreate, ClassUpdate>("classes", classesApi, {
  created: "Classe créée avec succès",
  updated: "Classe mise à jour",
  deleted: "Classe supprimée",
})

export { classKeys }
export const useClasses = useList
export const useInfiniteClasses = useInfiniteList
export const useClass = useDetail
export const useCreateClass = useCreate
export const useUpdateClass = useUpdate
export const useDeleteClass = useDelete
