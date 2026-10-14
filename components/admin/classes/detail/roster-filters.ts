export interface RosterFilters {
  genre?: string
  age_min?: number
  age_max?: number
  nationalities?: string[]
  assignments?: string[]
  repeaters?: boolean
}

export function rosterQuery(filters: RosterFilters = {}): string {
  const params = new URLSearchParams()
  if (filters.genre) params.set("genre", filters.genre)
  if (filters.age_min !== undefined) params.set("age_min", String(filters.age_min))
  if (filters.age_max !== undefined) params.set("age_max", String(filters.age_max))
  filters.nationalities?.forEach(value => { if (value.trim()) params.append("nationalities", value.trim()) })
  filters.assignments?.forEach(value => params.append("assignments", value))
  if (filters.repeaters !== undefined) params.set("repeaters", String(filters.repeaters))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}
