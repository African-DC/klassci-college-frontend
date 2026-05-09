"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tenantsApi } from "@/lib/api/super-admin/tenants"
import type { TenantProvisionRequest } from "@/lib/contracts/super-admin"

export const tenantKeys = {
  all: ["super-admin", "tenants"] as const,
  list: () => ["super-admin", "tenants", "list"] as const,
  detail: (slug: string) => ["super-admin", "tenants", "detail", slug] as const,
  slugCheck: (slug: string) => ["super-admin", "tenants", "slug-check", slug] as const,
}

export function useTenantsList() {
  return useQuery({
    queryKey: tenantKeys.list(),
    queryFn: () => tenantsApi.list(),
    staleTime: 30_000,
  })
}

export function useTenant(slug: string) {
  return useQuery({
    queryKey: tenantKeys.detail(slug),
    queryFn: () => tenantsApi.get(slug),
    enabled: !!slug,
    staleTime: 60_000,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TenantProvisionRequest) => tenantsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all })
    },
  })
}

export function useSlugCheck(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: tenantKeys.slugCheck(slug),
    queryFn: () => tenantsApi.checkSlug(slug),
    enabled: enabled && slug.length >= 2,
    staleTime: 5_000,
  })
}
