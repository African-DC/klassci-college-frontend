import type { Class } from "@/lib/contracts/class"

export interface ClassCapacity {
  enrolled: number
  max: number | null
  available: number | null
  full: boolean
}

export function classCapacity(cls: Pick<Class, "enrolled_count" | "max_students">): ClassCapacity {
  const enrolled = cls.enrolled_count ?? 0
  const max = cls.max_students ?? null
  const available = max != null ? Math.max(0, max - enrolled) : null
  return { enrolled, max, available, full: available === 0 }
}

export function classCapacityLabel(name: string, capacity: ClassCapacity): string {
  const { enrolled, max, available, full } = capacity
  if (available == null || max == null) return name
  if (full) return `${name} · complète (${enrolled}/${max})`
  const place = available > 1 ? "places" : "place"
  return `${name} · ${available} ${place} (${enrolled}/${max})`
}
