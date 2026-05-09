import { apiFetch } from "@/lib/api/client"
import {
  type TenantDetail,
  type TenantListResponse,
  type TenantProvisionRequest,
  type SlugCheckResponse,
  tenantDetailSchema,
  tenantListResponseSchema,
  slugCheckResponseSchema,
} from "@/lib/contracts/super-admin"

export const tenantsApi = {
  list: async (): Promise<TenantListResponse> => {
    return apiFetch<TenantListResponse>("/super-admin/tenants", {
      schema: tenantListResponseSchema,
    })
  },

  get: async (slug: string): Promise<TenantDetail> => {
    return apiFetch<TenantDetail>(`/super-admin/tenants/${encodeURIComponent(slug)}`, {
      schema: tenantDetailSchema,
    })
  },

  checkSlug: async (slug: string): Promise<SlugCheckResponse> => {
    return apiFetch<SlugCheckResponse>("/super-admin/tenants/check-slug", {
      method: "POST",
      body: JSON.stringify({ slug }),
      schema: slugCheckResponseSchema,
    })
  },

  create: async (data: TenantProvisionRequest) => {
    return apiFetch<{
      tenant_slug: string
      database: string
      admin_email: string
      status: string
      url: string
    }>("/super-admin/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}
