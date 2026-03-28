"use client"

import Link from "next/link"
import { Users, GraduationCap, Wallet, AlertCircle, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useParentDashboard } from "@/lib/hooks/useParentPortal"
import type { ParentChild } from "@/lib/contracts/parent-portal"

/** Seuil d'absences au-delà duquel on affiche un avertissement */
const ABSENCES_WARNING_THRESHOLD = 5

export function ParentDashboardClient() {
  const { data, isLoading, isError, refetch } = useParentDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <div className="space-y-6">
        <DashboardHeader name={null} />
        <DataError message="Impossible de charger le tableau de bord." onRetry={() => refetch()} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <DashboardHeader name={null} />
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucune donnée disponible.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader name={data.parent_name} />

      {/* Résumé */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-primary uppercase tracking-wider font-medium">Enfants inscrits</p>
            <p className="text-2xl font-bold">{data.total_children}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cartes enfants */}
      {data.children.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun enfant inscrit pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  )
}

function DashboardHeader({ name }: { name: string | null }) {
  return (
    <div>
      <h1 className="font-serif text-xl tracking-tight">
        {name ? `Bonjour, ${name.split(" ")[0]}` : "Espace Parent"}
      </h1>
      <p className="text-sm text-muted-foreground">Résumé de vos enfants</p>
    </div>
  )
}

function ChildCard({ child }: { child: ParentChild }) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-4 space-y-3">
        {/* En-tête enfant */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{child.full_name}</p>
            <p className="text-xs text-muted-foreground">{child.class_name}</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <GraduationCap className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className={`text-sm font-bold ${child.general_average === null ? "text-muted-foreground" : child.general_average >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {child.general_average !== null ? child.general_average.toFixed(2) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Moyenne</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <AlertCircle className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className={`text-sm font-bold ${child.total_absences > ABSENCES_WARNING_THRESHOLD ? "text-accent" : ""}`}>
              {child.total_absences}
            </p>
            <p className="text-[10px] text-muted-foreground">Absences</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <Wallet className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className={`text-sm font-bold ${child.fees_remaining > 0 ? "text-accent" : "text-emerald-600 dark:text-emerald-400"}`}>
              {child.fees_remaining.toLocaleString("fr-FR")}
            </p>
            <p className="text-[10px] text-muted-foreground">Reste (FC)</p>
          </div>
        </div>

        {/* Liens rapides */}
        <div className="flex gap-2">
          <Link
            href={`/parent/children/${child.id}/grades` as string & Record<never, never>}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            Notes <ChevronRight className="h-3 w-3" />
          </Link>
          <Link
            href={`/parent/children/${child.id}/fees` as string & Record<never, never>}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            Frais <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-20 rounded-lg" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-lg" />
      ))}
    </div>
  )
}
