import type { Route } from "next"

/**
 * Où ouvrir une fiche citée par le journal.
 *
 * Un seul endroit pour ces chemins : les puces « Fiches concernées » et le
 * lien « Ouvrir la fiche » du détail les partagent. Deux listes finiraient
 * par diverger, et l'une des deux mènerait à une page qui n'existe pas.
 */
const ROUTES: Record<string, (id: number) => Route> = {
  student: (id) => `/admin/students/${id}` as Route,
  parent: (id) => `/admin/parents/${id}` as Route,
  parent_student: (id) => `/admin/parents/${id}` as Route,
  teacher: (id) => `/admin/teachers/${id}` as Route,
  staff: (id) => `/admin/staff/${id}` as Route,
  class: (id) => `/admin/classes/${id}` as Route,
  enrollment: (id) => `/admin/enrollments/${id}` as Route,
}

/** Le chemin de la fiche, ou `null` quand elle n'a pas de page à ouvrir. */
export function entityHref(type: string | null | undefined, id: number | null | undefined): Route | null {
  if (!type || !id) return null
  const route = ROUTES[type]
  return route ? route(id) : null
}
