"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { Route } from "next"
import { GraduationCap, Sparkles, AlertCircle, Clock, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEnrollments } from "@/lib/hooks/useEnrollments"

const LEVELS = [
  { name: "6ème", short: "6e" },
  { name: "5ème", short: "5e" },
  { name: "4ème", short: "4e" },
  { name: "3ème", short: "3e" },
  { name: "2nde", short: "2nd" },
  { name: "1ère", short: "1re" },
  { name: "Terminale", short: "Tle" },
] as const

type NodeStatus = "reussi" | "en_cours" | "redouble" | "non_inscrit"

interface JourneyNode {
  level: string
  short: string
  status: NodeStatus
  className: string | null
  yearLabel: string | null
  average: number | null
  rank: { position: number; total: number } | null
}

interface Enrollment {
  id: number
  class_id: number
  class_name?: string | null
  academic_year_name?: string | null
  status?: string | null
}

function deriveStatus(enr: Enrollment | undefined, isCurrent: boolean): NodeStatus {
  if (!enr) return "non_inscrit"
  if (isCurrent) return "en_cours"
  // sans data historique d'AY passées, on suppose validé = réussi
  return enr.status === "valide" ? "reussi" : "en_cours"
}

function levelFromClassName(name: string | null | undefined): string | null {
  if (!name) return null
  const trimmed = name.trim().toLowerCase()
  if (trimmed.startsWith("6")) return "6ème"
  if (trimmed.startsWith("5")) return "5ème"
  if (trimmed.startsWith("4")) return "4ème"
  if (trimmed.startsWith("3")) return "3ème"
  if (trimmed.startsWith("2") || trimmed.startsWith("seconde") || trimmed.startsWith("2nd")) return "2nde"
  if (trimmed.startsWith("1ere") || trimmed.startsWith("1ère") || trimmed.startsWith("1re") || trimmed.startsWith("première")) return "1ère"
  if (trimmed.startsWith("term") || trimmed.startsWith("tle") || trimmed.startsWith("tale")) return "Terminale"
  return null
}

const STATUS_STYLE: Record<NodeStatus, { ring: string; bg: string; dot: string; label: string; chip: string }> = {
  reussi: {
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    dot: "bg-emerald-600 text-white",
    label: "Réussi",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  en_cours: {
    ring: "ring-primary/50",
    bg: "bg-primary/5",
    dot: "bg-primary text-primary-foreground",
    label: "En cours",
    chip: "bg-primary/10 text-primary",
  },
  redouble: {
    ring: "ring-amber-500/40",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-600 text-white",
    label: "Redoublé",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  non_inscrit: {
    ring: "ring-border",
    bg: "bg-muted/30",
    dot: "bg-muted text-muted-foreground",
    label: "À venir",
    chip: "bg-muted text-muted-foreground",
  },
}

interface StudentJourneyTimelineProps {
  studentId: number
  studentName: string
}

export function StudentJourneyTimeline({ studentId, studentName }: StudentJourneyTimelineProps) {
  const { data, isLoading } = useEnrollments({ student_id: studentId })

  const enrollments = useMemo(() => {
    const items = (data?.items ?? []) as Enrollment[]
    // tri du plus ancien au plus récent (year_name lexicographique fonctionne pour "2024-2025" etc.)
    return [...items].sort((a, b) => {
      const ya = a.academic_year_name ?? ""
      const yb = b.academic_year_name ?? ""
      return ya.localeCompare(yb)
    })
  }, [data])

  const currentEnrollment = enrollments[enrollments.length - 1]

  const nodes: JourneyNode[] = useMemo(() => {
    return LEVELS.map((lvl) => {
      const match = enrollments.find((e) => levelFromClassName(e.class_name) === lvl.name)
      const isCurrent = match?.id === currentEnrollment?.id
      return {
        level: lvl.name,
        short: lvl.short,
        status: deriveStatus(match, isCurrent),
        className: match?.class_name ?? null,
        yearLabel: match?.academic_year_name ?? null,
        average: null, // pas encore exposé par BE
        rank: null,
      }
    })
  }, [enrollments, currentEnrollment])

  const validatedCount = nodes.filter((n) => n.status === "reussi").length
  const hasAny = nodes.some((n) => n.status !== "non_inscrit")

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (!hasAny) {
    return (
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <GraduationCap className="h-5 w-5 text-primary" />
            Parcours scolaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/30 px-6 py-10 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/60" />
            <div>
              <p className="text-sm font-medium">{studentName} n&apos;est pas encore inscrit·e</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Le parcours s&apos;affichera ici dès la première inscription validée
              </p>
            </div>
            <Link
              href={`/admin/enrollments?action=create&student_id=${studentId}` as Route}
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Inscrire maintenant <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <GraduationCap className="h-5 w-5 text-primary" />
              Parcours scolaire
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              De la 6<sup>e</sup> à la Terminale — {validatedCount} niveau{validatedCount > 1 ? "x" : ""} validé{validatedCount > 1 ? "s" : ""}
            </p>
          </div>
          {currentEnrollment?.class_name && (
            <span className="hidden text-right text-xs text-muted-foreground sm:block">
              <span className="block font-medium text-foreground">{currentEnrollment.class_name}</span>
              <span>{currentEnrollment.academic_year_name}</span>
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-6 pt-4">
        {/* Timeline — horizontal scroll on mobile */}
        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative flex min-w-[640px] items-start gap-0 pt-1 sm:min-w-0">
            {/* connecting line behind nodes */}
            <div className="absolute left-6 right-6 top-[26px] -z-0 h-0.5 bg-gradient-to-r from-border via-border to-border/40" aria-hidden />

            {nodes.map((node, idx) => {
              const style = STATUS_STYLE[node.status]
              const isLast = idx === nodes.length - 1
              return (
                <div key={node.level} className="relative z-10 flex flex-1 flex-col items-center text-center">
                  {/* Node circle */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-background ${style.dot}`}>
                    {node.status === "reussi" ? (
                      <Sparkles className="h-5 w-5" />
                    ) : node.status === "en_cours" ? (
                      <Clock className="h-5 w-5" />
                    ) : node.status === "redouble" ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-xs font-semibold">{node.short}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2 flex w-full flex-col items-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                      {node.level}
                    </span>
                    {node.className ? (
                      <span className="text-[10px] font-mono text-muted-foreground">{node.className}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60">—</span>
                    )}
                    <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${style.chip}`}>
                      {style.label}
                    </span>
                    {node.yearLabel && (
                      <span className="mt-1 text-[10px] text-muted-foreground">{node.yearLabel}</span>
                    )}
                  </div>

                  {/* spacer */}
                  {!isLast && <span className="sr-only">étape suivante</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 border-t pt-3 text-[10px] text-muted-foreground">
          <LegendItem color="bg-emerald-600" label="Réussi" />
          <LegendItem color="bg-primary" label="En cours" />
          <LegendItem color="bg-amber-600" label="Redoublé" />
          <LegendItem color="bg-muted-foreground/40" label="À venir" />
        </div>
      </CardContent>
    </Card>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden />
      {label}
    </span>
  )
}
