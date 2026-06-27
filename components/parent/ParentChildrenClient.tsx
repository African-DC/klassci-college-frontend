"use client"

import Link from "next/link"
import type { Route } from "next"
import { Users, GraduationCap, Wallet, AlertCircle, FileText, Calendar, Clock, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { useParentChildren } from "@/lib/hooks/useParentPortal"
import type { ParentChild } from "@/lib/contracts/parent-portal"
import { isEnrolledFromClassName, summarizeEnrollment } from "@/lib/utils/enrollment-status"
import { cn } from "@/lib/utils"

/** Seuil d'absences au-delà duquel on affiche un avertissement */
const ABSENCES_WARNING_THRESHOLD = 5

export function ParentChildrenClient() {
  const { data: children, isLoading, isError, refetch } = useParentChildren()

  // Subtitle adapté : si tous enfants inscrits → "X enfants", sinon breakdown
  // "X inscrits · Y en attente" pour clarifier le statut tri-état.
  const subtitle = (() => {
    if (!children || children.length === 0) return null
    const summary = summarizeEnrollment(children)
    if (summary.pending === 0) {
      return `${summary.total} enfant${summary.total > 1 ? "s" : ""}`
    }
    return `${summary.enrolled} inscrit${summary.enrolled > 1 ? "s" : ""} · ${summary.pending} en attente d'inscription`
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Mes enfants</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {children && children.length > 0 && <ChildrenKpis children={children} />}

      {isLoading ? (
        <ChildrenSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger la liste des enfants." onRetry={() => refetch()} />
      ) : !children || children.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Users aria-hidden="true" className="mb-3 h-10 w-10 text-amber-500" />
            <p className="text-sm font-medium text-amber-900">Aucun enfant rattaché à votre compte.</p>
            <p className="mt-1 text-xs text-amber-800">
              Rendez-vous au secrétariat de l&apos;école pour faire le rattachement.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <ChildDetailCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChildrenKpis({ children }: { children: ParentChild[] }) {
  const summary = summarizeEnrollment(children)
  const remaining = children
    .filter((c) => isEnrolledFromClassName(c.class_name))
    .reduce((s, c) => s + (c.fees_remaining ?? 0), 0)
  const kpis: KpiItem[] = [
    { label: "Enfants", value: summary.total, icon: Users, tone: "primary" },
    { label: "Inscrits", value: summary.enrolled, icon: UserCheck, tone: "emerald" },
    { label: "En attente", value: summary.pending, icon: Clock, tone: summary.pending > 0 ? "accent" : "default" },
    {
      label: "Restant total",
      value: `${remaining.toLocaleString("fr-FR")} F`,
      icon: Wallet,
      tone: remaining > 0 ? "accent" : "default",
    },
  ]
  return <KpiStrip items={kpis} />
}

function ChildDetailCard({ child }: { child: ParentChild }) {
  const isEnrolled = isEnrolledFromClassName(child.class_name)

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">
                {child.full_name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold">{child.full_name}</p>
              {isEnrolled ? (
                <Badge variant="secondary" className="text-[10px]">{child.class_name}</Badge>
              ) : (
                <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-[10px] font-medium text-amber-800">
                  En attente d&apos;inscription
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Banner explicite quand pas inscrit : signal clair à Mme Aïcha,
            pas de KPIs trompeurs (0 FCFA vert quand rien à payer parce que
            pas inscrit). Cf. rule `not-enrolled-empty-state.md`. */}
        {!isEnrolled && (
          <div role="status" className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-900">
              L&apos;inscription n&apos;est pas encore validée par l&apos;administration. Notes, frais
              et emploi du temps apparaîtront ici une fois l&apos;inscription confirmée.
            </p>
          </div>
        )}

        {/* Indicateurs : neutralisés à "—" muted gris quand pas inscrit
            (au lieu de "0 FCFA" vert success qui suggérait à tort
            "tout est payé !"). */}
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className={cn(
                "text-sm font-bold",
                !isEnrolled || child.general_average === null
                  ? "text-muted-foreground"
                  : child.general_average >= 10
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive",
              )}>
                {isEnrolled && child.general_average !== null
                  ? `${child.general_average.toFixed(2)}/20`
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Moyenne</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className={cn(
                "text-sm font-bold",
                !isEnrolled
                  ? "text-muted-foreground"
                  : child.total_absences > ABSENCES_WARNING_THRESHOLD
                    ? "text-accent"
                    : "",
              )}>
                {isEnrolled ? child.total_absences : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Absences</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wallet aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className={cn(
                "text-sm font-bold",
                !isEnrolled
                  ? "text-muted-foreground"
                  : child.fees_remaining > 0
                    ? "text-accent"
                    : "text-emerald-600 dark:text-emerald-400",
              )}>
                {isEnrolled ? `${child.fees_remaining.toLocaleString("fr-FR")} FCFA` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Restant</p>
            </div>
          </div>
        </div>

        {/* Actions : 4 liens — Notes / Frais / EDT / Documents. Disabled si
            pas inscrit (sauf Documents qui ont leur propre fallback côté
            ParentChildDocumentsClient). */}
        <div className="grid grid-cols-4 gap-2">
          <ChildActionLink
            href={`/parent/children/${child.id}/grades` as Route}
            icon={GraduationCap}
            label="Notes"
            disabled={!isEnrolled}
          />
          <ChildActionLink
            href={`/parent/children/${child.id}/fees` as Route}
            icon={Wallet}
            label="Frais"
            disabled={!isEnrolled}
          />
          <ChildActionLink
            href={`/parent/children/${child.id}/timetable` as Route}
            icon={Calendar}
            label="EDT"
            disabled={!isEnrolled}
          />
          <ChildActionLink
            href={`/parent/children/${child.id}/documents` as Route}
            icon={FileText}
            label="Docs"
            disabled={false}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ChildActionLink({
  href,
  icon: Icon,
  label,
  disabled,
}: {
  href: Route
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
  label: string
  disabled: boolean
}) {
  const baseClasses = "flex items-center justify-center gap-1 rounded-md px-2 py-2.5 text-xs font-medium transition-colors"
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        title="Disponible après validation de l'inscription"
        className={cn(baseClasses, "cursor-not-allowed bg-muted/40 text-muted-foreground")}
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </span>
    )
  }
  return (
    <Link href={href} className={cn(baseClasses, "bg-primary/5 text-primary hover:bg-primary/10")}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </Link>
  )
}

function ChildrenSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  )
}
