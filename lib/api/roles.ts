import { z } from "zod"
import { RoleSchema, PermissionSchema } from "@/lib/contracts/role"
import type { Role, RoleCreate, RoleUpdate, Permission } from "@/lib/contracts/role"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, safeValidate } from "./client"

export const rolesApi = createCrudApi<Role, RoleCreate, RoleUpdate>(
  "/admin/roles",
  RoleSchema,
)

const PermissionsArraySchema = z.array(PermissionSchema)

/** Récupère toutes les permissions disponibles */
export async function getPermissions(): Promise<Permission[]> {
  const res = await apiFetch<unknown>("/admin/permissions")
  // Gère les deux formats de réponse : Permission[] ou { data: Permission[] }
  const raw = Array.isArray(res) ? res : (res as { data?: unknown }).data ?? res
  return safeValidate(PermissionsArraySchema, raw, "/admin/permissions")
}
