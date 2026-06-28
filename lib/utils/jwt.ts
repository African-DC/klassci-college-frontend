interface JwtPayload {
  exp?: number
  sub?: string
  role?: string
  tenant_id?: string
  [key: string]: unknown
}

export function decodeJwtPayload(token: string): JwtPayload {
  const base64Url = token.split(".")[1]
  if (!base64Url) throw new Error("Invalid JWT format")
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const json = Buffer.from(base64, "base64").toString("utf-8")
  return JSON.parse(json) as JwtPayload
}

export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  try {
    const { exp } = decodeJwtPayload(token)
    if (!exp) return true
    return Date.now() >= (exp - bufferSeconds) * 1000
  } catch {
    return true
  }
}

/**
 * Lit le claim `tenant_id` d'un JWT BE. Le slug tenant EST le tenant_id dans
 * KLASSCI (le middleware le pose depuis X-Tenant-Slug au login), donc cette
 * valeur sert à rescopée le refresh côté BE. Retourne null si illisible.
 */
export function getTokenTenant(token: string): string | null {
  try {
    return decodeJwtPayload(token).tenant_id ?? null
  } catch {
    return null
  }
}
