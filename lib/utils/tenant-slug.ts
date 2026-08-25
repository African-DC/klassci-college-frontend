export const TENANT_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/

export const SCHOOL_LOGIN_ALIASES: Record<string, string> = {
  rostan: "rostan-bouake",
  "college-rostan": "rostan-bouake",
  "college rostan": "rostan-bouake",
  "rostan bouake": "rostan-bouake",
  "rostan-bouake": "rostan-bouake",
}

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

function normalizeSchoolCode(value: string): string {
  return value.trim().toLowerCase().replace(/[_./]+/g, " ").replace(/\s+/g, " ")
}

/**
 * Turns a school-facing code into the technical tenant slug.
 * Accepts ROSTAN, rostan-bouake, or a spaced school name.
 */
export function resolveSchoolLoginCode(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = normalizeSchoolCode(value)
  if (!normalized) return null
  const compact = normalized.replace(/\s+/g, "-")
  const aliased = SCHOOL_LOGIN_ALIASES[normalized] ?? SCHOOL_LOGIN_ALIASES[compact]
  if (aliased) return aliased
  if (TENANT_SLUG_REGEX.test(compact)) return compact
  return null
}
