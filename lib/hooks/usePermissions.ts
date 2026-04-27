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
    isLoading: enabled && isLoading,
    isFetching,
  }
}
