"use client"

import { staffApi } from "@/lib/api/staff"
import type { Staff, StaffCreate, StaffUpdate } from "@/lib/contracts/staff"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: staffKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Staff, StaffCreate, StaffUpdate>("staff", staffApi, {
  created: "Personnel créé avec succès",
  updated: "Personnel mis à jour",
  deleted: "Personnel supprimé",
  errorFallback: "Impossible de charger le personnel",
})

export { staffKeys }
export const useStaffList = useList
export const useStaffMember = useDetail
export const useCreateStaff = useCreate
export const useUpdateStaff = useUpdate
export const useDeleteStaff = useDelete
