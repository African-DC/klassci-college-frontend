"use client"

import Link from "next/link"
import { Users, GraduationCap, Wallet, AlertCircle, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useParentChildren } from "@/lib/hooks/useParentPortal"
import type { ParentChild } from "@/lib/contracts/parent-portal"

/** Seuil d'absences au-delà duquel on affiche un avertissement */
const ABSENCES_WARNING_THRESHOLD = 5

export function ParentChildrenClient() {
  const { data: children, isLoading, isError, refetch } = useParentChildren()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Mes enfants</h1>
        <p className="text-sm text-muted-foreground">Liste des enfants inscrits</p>
      </div>

      {isLoading ? (
        <ChildrenSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger la liste des enfants." onRetry={() => refetch()} />
      ) : !children || children.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun enfant inscrit.</p>
        </div>
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

function ChildDetailCard({ child }: { child: ParentChild }) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">
                {child.full_name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">{child.full_name}</p>
              <Badge variant="secondary" className="text-[10px]">{child.class_name}</Badge>
            </div>
          </div>
        </div>

        {/* Indicateurs */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className={`text-sm font-bold ${child.general_average === null ? "text-muted-foreground" : child.general_average >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {child.general_average !== null ? `${child.general_average.toFixed(2)}/20` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Moyenne</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className={`text-sm font-bold ${child.total_absences > ABSENCES_WARNING_THRESHOLD ? "text-accent" : ""}`}>
                {child.total_absences}
              </p>
              <p className="text-[10px] text-muted-foreground">Absences</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className={`text-sm font-bold ${child.fees_remaining > 0 ? "text-accent" : "text-emerald-600 dark:text-emerald-400"}`}>
                {child.fees_remaining.toLocaleString("fr-FR")} FC
              </p>
              <p className="text-[10px] text-muted-foreground">Restant</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/parent/children/${child.id}/grades` as never}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Voir les notes
            <ChevronRight className="h-3 w-3" />
          </Link>
          <Link
            href={`/parent/children/${child.id}/fees` as never}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Wallet className="h-3.5 w-3.5" />
            Voir les frais
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
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
