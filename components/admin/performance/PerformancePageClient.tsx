"use client"

import { Gauge, Users, Star, AlertCircle, UserCog, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataError } from "@/components/shared/DataError"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { useStaffActivity, useTeachersPerformance } from "@/lib/hooks/usePerformance"
import { formatScore } from "@/lib/utils/performance"
import { TeachersPerformanceTable } from "./TeachersPerformanceTable"
import { StaffActivityTable } from "./StaffActivityTable"

export function PerformancePageClient() {
  const teachersQuery = useTeachersPerformance()
  const staffQuery = useStaffActivity()

  if (teachersQuery.isLoading) return <PerformanceSkeleton />

  if (teachersQuery.isError || !teachersQuery.data) {
    return (
      <div className="space-y-6">
        <PageHero icon={Gauge} title="Performance" subtitle="Enseignants et personnel" />
        <DataError
          message="Impossible de charger la performance."
          onRetry={() => teachersQuery.refetch()}
        />
      </div>
    )
  }

  const { teachers, summary, academic_year_name } = teachersQuery.data

  const heroKpis: HeroKpi[] = [
    {
      label: "Enseignants notés",
      value: `${summary.teachers_scored}/${summary.teachers_total}`,
      icon: Users,
    },
    {
      label: "Score moyen",
      value: formatScore(summary.teachers_avg_score),
      icon: Star,
    },
    {
      label: "À compléter",
      value: summary.teachers_insufficient,
      icon: AlertCircle,
      hint: "données manquantes",
    },
    {
      label: "Personnel actif",
      value: `${summary.staff_active}/${summary.staff_total}`,
      icon: UserCog,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        icon={Gauge}
        title="Performance"
        subtitle={`Enseignants et personnel · Année ${academic_year_name}`}
        kpis={heroKpis}
      />

      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teachers">Enseignants</TabsTrigger>
          <TabsTrigger value="staff">Personnel</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Score sur 100, moyenne pondérée de trois axes : assiduité (40%), saisie des notes
              (35%) et prise de l'appel (25%). Un axe sans donnée n'est pas noté et n'abaisse pas le
              score. Les résultats des élèves ne sont pas pris en compte.
            </p>
          </div>
          <TeachersPerformanceTable teachers={teachers} />
        </TabsContent>

        <TabsContent value="staff" className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Activité factuelle du personnel sur l'année (versements encaissés, inscriptions
              traitées). Pas de note : ces indicateurs mesurent le volume d'activité, pas une
              performance comparable.
            </p>
          </div>
          {staffQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : staffQuery.isError || !staffQuery.data ? (
            <DataError
              message="Impossible de charger l'activité du personnel."
              onRetry={() => staffQuery.refetch()}
            />
          ) : (
            <StaffActivityTable staff={staffQuery.data.staff} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-9 w-48 rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
