export type RelationshipType = "father" | "mother" | "guardian" | "other"

export type RelationshipTone = "primary" | "accent" | "warning" | "neutral"

export interface RelationshipMeta {
  value: RelationshipType
  label: string
  tone: RelationshipTone
}

export const RELATIONSHIPS: readonly RelationshipMeta[] = [
  { value: "father", label: "Père", tone: "primary" },
  { value: "mother", label: "Mère", tone: "accent" },
  { value: "guardian", label: "Tuteur", tone: "warning" },
  { value: "other", label: "Autre", tone: "neutral" },
] as const

const DEFAULT_META: RelationshipMeta = { value: "other", label: "Contact", tone: "neutral" }

export function getRelationshipMeta(value: string | null | undefined): RelationshipMeta {
  if (!value) return DEFAULT_META
  return RELATIONSHIPS.find((r) => r.value === value) ?? DEFAULT_META
}

export function buildWhatsAppHref(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d]/g, "")
  if (digits.length < 8) return null
  return `https://wa.me/${digits}`
}
