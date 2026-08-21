"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { authApi } from "@/lib/api/auth"

/**
 * Centralized query keys for the current user's effective permissions.
 * Invalidate `permissionKeys.current` after mutations on /admin/roles to
 * ensure the gating UI reflects fresh perms within a session.
 */
export const permissionKeys = {
  current: ["auth", "permissions"] as const,
}

/**
 * Returns the current user's effective permissions and helpers to gate UI.
 * Server-side authorization remains enforced via require_permission(...) on
 * the BE — this hook is purely for showing/hiding affordances in the UI.
 *
 * Cached 5 min, only fetched while a session exists. Reset on signOut.
 */
export function usePermissions() {
  const { status } = useSession()
  const enabled = status === "authenticated"

  const { data, isLoading, isFetching } = useQuery({
    queryKey: permissionKeys.current,
    queryFn: () => authApi.myPermissions(),
    staleTime: 1000 * 60 * 5,
    enabled,
  })

  const set = data ? new Set(data) : null

  return {
    permissions: data ?? [],
    has: (slug: string) => (set ? set.has(slug) : false),
    hasAny: (slugs: string[]) => (set ? slugs.some((s) => set.has(s)) : false),
    hasAll: (slugs: string[]) => (set ? slugs.every((s) => set.has(s)) : false),
    // La session compte comme un chargement. Sans cela, pendant que NextAuth
    // s'amorce, `enabled` est faux, donc `isLoading` est faux, et `has()` rend
    // faux faute de données : un écran qui teste « pas en chargement ET pas le
    // droit » affiche « Accès refusé » à tout le monde, y compris à un
    // administrateur, avant de basculer sur le vrai contenu.
    isLoading: status === "loading" || (enabled && isLoading),
    isFetching,
  }
}
