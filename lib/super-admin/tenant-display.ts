/**
 * Helpers d'affichage pour les URLs tenant côté super-admin et wizard.
 *
 * Pattern actuel (B-Lean single-domain) : un client se connecte via
 * ``https://college.klassci.com/login?c=<slug>``. Le slug voyage dans le
 * paramètre de query, est forwardé au BE par le LoginForm via le header
 * ``X-Tenant-Slug``, puis persisté en cookie ``tenant_code`` pour les
 * visites suivantes.
 *
 * Pour basculer plus tard vers un pattern par sous-domaine
 * (``https://<slug>.college.klassci.com/login``) : flipper la valeur de
 * ``settings.PUBLIC_LOGIN_URL_TEMPLATE`` côté BE et le template constant
 * ci-dessous — pas de refactor de composants nécessaire.
 */

const PUBLIC_LOGIN_URL_TEMPLATE = "https://college.klassci.com/login?c={slug}"
const SYSTEM_TENANT_URL = "https://college.klassci.com"

export function isSystemTenant(slug: string): boolean {
  return slug === "local"
}

export function tenantUrl(slug: string): string {
  if (isSystemTenant(slug)) return SYSTEM_TENANT_URL
  return PUBLIC_LOGIN_URL_TEMPLATE.replace("{slug}", slug)
}
