// Palette partagée Subjects (Kanban + Table). Aligné sur SUBJECT_COLOR_PALETTE
// du contract Zod. Chaque token Tailwind est défini en utilities statiques pour
// que le purge JIT capture les classes (pas de string concat dynamique).

export interface SubjectColorTokens {
  bg: string
  text: string
  border: string
  badge: string
}

const COLOR_MAP: Record<string, SubjectColorTokens> = {
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-700",    border: "border-blue-200",    badge: "bg-blue-600" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-600" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-700",   border: "border-amber-200",   badge: "bg-amber-600" },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-700",  border: "border-violet-200",  badge: "bg-violet-600" },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-700",    border: "border-rose-200",    badge: "bg-rose-500" },
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-700",    border: "border-cyan-200",    badge: "bg-cyan-600" },
  orange:  { bg: "bg-orange-500/10",  text: "text-orange-700",  border: "border-orange-200",  badge: "bg-orange-500" },
  indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-700",  border: "border-indigo-200",  badge: "bg-indigo-600" },
  teal:    { bg: "bg-teal-500/10",    text: "text-teal-700",    border: "border-teal-200",    badge: "bg-teal-600" },
  red:     { bg: "bg-red-500/10",     text: "text-red-700",     border: "border-red-200",     badge: "bg-red-500" },
  green:   { bg: "bg-green-500/10",   text: "text-green-700",   border: "border-green-200",   badge: "bg-green-600" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-700",    border: "border-pink-200",    badge: "bg-pink-500" },
}

const DEFAULT_COLOR: SubjectColorTokens = {
  bg: "bg-slate-500/10",
  text: "text-slate-700",
  border: "border-slate-200",
  badge: "bg-slate-500",
}

export function getSubjectColor(color: string | null | undefined): SubjectColorTokens {
  if (!color) return DEFAULT_COLOR
  return COLOR_MAP[color] ?? DEFAULT_COLOR
}

export function teacherInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
