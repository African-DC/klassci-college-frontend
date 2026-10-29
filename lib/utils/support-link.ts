/** Le centre d'assistance vit dans le portail admin : les autres portails n'y ont pas accès. */
export function canReportFrom(pathname: string | null): boolean {
  return pathname?.startsWith("/admin") ?? false
}
