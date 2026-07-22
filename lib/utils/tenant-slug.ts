export const TENANT_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/

export type TenantSlugResolution =
  | { status: "valid"; tenant: string }
  | { status: "missing" | "invalid" }

/**
 * Resolves the public verifier tenant from a query-string value.
 * Repeated values are rejected to keep the request tenant unambiguous.
 */
export function resolveTenantSlug(value: string | readonly string[] | undefined): TenantSlugResolution {
  if (value === undefined) return { status: "missing" }
  if (typeof value !== "string" || !TENANT_SLUG_REGEX.test(value)) return { status: "invalid" }

  return { status: "valid", tenant: value }
}
