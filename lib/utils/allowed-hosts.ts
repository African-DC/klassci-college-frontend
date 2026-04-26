/**
 * Host allowlist — protection CSRF / host header injection.
 *
 * Avec AUTH_TRUST_HOST=true (nécessaire pour multi-tenant subdomain en NextAuth v5),
 * un attacker contrôlant n'importe quel sous-domaine arbitraire pourrait minter
 * des cookies d'auth. Cette validation s'assure que seuls les hosts attendus
 * sont acceptés.
 *
 * Doit miroir la regex côté BE (app/core/middleware.py).
 */

// Pattern par défaut : single-domain college.klassci.com + sous-domaines rétrocompat.
// Architecture single-domain (depuis 2026-04-26) : tous les tenants passent par
// college.klassci.com, le tenant est résolu via JWT/header X-Tenant-Slug côté BE.
const DEFAULT_PATTERN = /^(college\.klassci\.com|[a-z0-9][a-z0-9\-]{0,61}\.college\.klassci\.com)$/

// Hôtes locaux acceptés en dev (toujours, indépendamment du pattern)
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", ""])

const ALLOWED_PATTERN = process.env.NEXT_PUBLIC_ALLOWED_HOST_PATTERN
  ? new RegExp(process.env.NEXT_PUBLIC_ALLOWED_HOST_PATTERN)
  : DEFAULT_PATTERN

const EXTRA_ALLOWED_HOSTS = (process.env.NEXT_PUBLIC_EXTRA_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean)

/**
 * Valide un hostname (sans port) contre l'allowlist.
 *
 * Accepte :
 *   - hostnames matchant le pattern (ex: lycee-x.college.klassci.com)
 *   - hostnames listés explicitement dans EXTRA_ALLOWED_HOSTS
 *   - hôtes locaux (localhost, 127.0.0.1) en dev
 *   - IPs numériques (16.58.132.68) en dev
 */
export function isHostAllowed(hostname: string): boolean {
  if (LOCAL_HOSTS.has(hostname)) return true
  if (/^[\d.]+$/.test(hostname)) return true
  if (EXTRA_ALLOWED_HOSTS.includes(hostname)) return true
  return ALLOWED_PATTERN.test(hostname)
}

/**
 * Extrait le hostname depuis un header Host (en retirant le port).
 */
export function extractHostname(host: string | null | undefined): string {
  if (!host) return ""
  return host.split(":")[0]
}
