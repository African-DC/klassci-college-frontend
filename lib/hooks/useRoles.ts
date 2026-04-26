"use client"

import { useQuery } from "@tanstack/react-query"
import { rolesApi, getPermissions } from "@/lib/api/roles"
import type { Role, RoleCreate, RoleUpdate } from "@/lib/contracts/role"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: roleKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Role, RoleCreate, RoleUpdate>("roles", rolesApi, {
  created: "Rôle créé avec succès",
  updated: "Rôle mis à jour",
  deleted: "Rôle supprimé",
})

export { roleKeys }
export const useRoles = useList
export const useRole = useDetail
export const useCreateRole = useCreate
export const useUpdateRole = useUpdate
export const useDeleteRole = useDelete

/** Liste toutes les permissions disponibles */
export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    staleTime: 1000 * 60 * 10,
  })
}
