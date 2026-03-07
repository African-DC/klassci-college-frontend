interface JwtPayload {
  exp?: number
  sub?: string
  role?: string
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
