"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { Route } from "next"
import { GraduationCap, Plus, Calendar, ChevronRight, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { SectionCard, StatusPill, EmptyState } from "./_primitives"

interface EnrollmentTabProps {
  studentId: number
}

function statusTone(s: string): "success" | "warning" | "danger" | "neutral" | "primary" {
  if (s === "valide") return "success"
  if (s === "en_validation") return "warning"
  if (s === "prospect") return "primary"
  if (s === "rejete" || s === "annule") return "danger"
  return "neutral"
}

function statusLabel(s: string): string {
  if (s === "valide") return "Validé"
  if (s === "en_validation") return "En validation"
  if (s === "prospect") return "Prospect"
  if (s === "rejete") return "Rejeté"
  if (s === "annule") return "Annulé"
  return s
}

export function EnrollmentTab({ studentId }: EnrollmentTabProps) {
  const { data, isLoading, isError, refetch } = useEnrollments({ student_id: studentId })

  const enrollments = useMemo(() => {
    const items = data?.items ?? []
    return [...items].sort((a, b) => {
      const ya = String((a as Record<string, unknown>).academic_year_name ?? "")
      const yb = String((b as Record<string, unknown>).academic_year_name ?? "")
      return yb.localeCompare(ya) // descendant : année courante en haut
    })
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    )
  }

  if (isError) return <DataError message="Impossible de charger les inscriptions." onRetry={() => refetch()} />

  if (enrollments.length === 0) {
    return (
      <SectionCard
        icon={<GraduationCap className="h-4 w-4" />}
        title="Inscriptions"
        description="Aucune année scolaire encore enregistrée"
      >
        <EmptyState
          icon={<GraduationCap className="h-5 w-5" />}
          title="Pas encore d'inscription"
          message="Inscrivez cet élève dans une classe pour démarrer son parcours scolaire."
          cta={
            <Link
              href={`/admin/enrollments?action=create&student_id=${studentId}` as Route}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Inscrire maintenant
            </Link>
          }
        />
      </SectionCard>
    )
  }

  const current = enrollments[0] as Record<string, unknown>
  const history = enrollments.slice(1)

  return (
    <div className="space-y-4">
      {/* Inscription courante — hero */}
      <SectionCard
        icon={<Sparkles className="h-4 w-4" />}
        title="Inscription courante"
        description="Année scolaire en cours"
        action={
          <StatusPill tone={statusTone(String(current.status ?? ""))}>
            {statusLabel(String(current.status ?? ""))}
          </StatusPill>
        }
      >
        <Link
          href={`/admin/enrollments/${String(current.id)}` as Route}
          className="group block"
        >
          <div className="flex items-start gap-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-4 transition-all group-hover:border-primary/40 group-hover:shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg leading-tight">
                {current.class_name ? String(current.class_name) : `Classe #${current.class_id}`}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {current.academic_year_name ? String(current.academic_year_name) : "Année non précisée"}
              </p>
              {Boolean(current.created_at) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Inscrit le{" "}
                  {new Date(String(current.created_at)).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </Link>

        <div className="mt-3 flex gap-2">
          <Link
            href={`/admin/enrollments?action=create&student_id=${studentId}` as Route}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted sm:h-9"
          >
            <Plus className="h-4 w-4" />
            Nouvelle inscription
          </Link>
        </div>
      </SectionCard>

      {/* Historique des inscriptions */}
      {history.length > 0 && (
        <SectionCard
          icon={<Calendar className="h-4 w-4" />}
          title="Historique scolaire"
          description={`${history.length} année${history.length > 1 ? "s" : ""} précédente${history.length > 1 ? "s" : ""}`}
        >
          <ul className="space-y-2">
            {history.map((enrollment) => {
              const e = enrollment as Record<string, unknown>
              const status = String(e.status ?? "")
              const createdAt = e.created_at
                ? new Date(String(e.created_at)).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : null
              return (
                <li key={String(e.id)}>
                  <Link
                    href={`/admin/enrollments/${String(e.id)}` as Route}
                    className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {e.class_name ? String(e.class_name) : `Classe #${e.class_id}`}
                        </p>
                        <StatusPill tone={statusTone(status)}>{statusLabel(status)}</StatusPill>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.academic_year_name ? String(e.academic_year_name) : "—"}
                        {createdAt && ` · Inscrit le ${createdAt}`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}
