"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  Users,
  GraduationCap,
  ClipboardList,
  ChevronRight,
  School,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { PageHero, premiumCardHover, type HeroKpi } from "@/components/shared/PageHero"
import { ListSearchBar } from "@/components/shared/list/ListSearchBar"
import { matchesSearch } from "@/lib/utils/list-search"
import { useTeacherClasses } from "@/lib/hooks/useTeacherPortal"
import type { TeacherClass } from "@/lib/contracts/teacher-portal"

export function TeacherClassesClient() {
  const { data: classes, isLoading, isError, refetch } = useTeacherClasses()
  const [search, setSearch] = useState("")

  const list = useMemo(() => classes ?? [], [classes])
  const kpis: HeroKpi[] = useMemo(() => {
    const students = list.reduce((s, c) => s + (c.student_count ?? 0), 0)
    const evals = list.reduce((s, c) => s + (c.total_evaluations ?? 0), 0)
    const graded = list.filter((c) => c.general_average !== null && c.general_average !== undefined)
    const avg = graded.length
      ? graded.reduce((s, c) => s + (c.general_average ?? 0), 0) / graded.length
      : null
    return [
      { label: "Classes", value: list.length, icon: School },
      { label: "Élèves", value: students, icon: Users },
      { label: "Évaluations", value: evals, icon: ClipboardList },
      { label: "Moyenne globale", value: avg !== null ? avg.toFixed(2) : "—", icon: GraduationCap },
    ]
  }, [list])

  const filtered = useMemo(
    () => list.filter((c) => matchesSearch([c.class_name, c.subject_name, c.level_name], search)),
    [list, search],
  )

  return (
    <div className="space-y-6">
      <PageHero
        icon={School}
        title="Mes classes"
        subtitle="Classes assignées et statistiques"
        kpis={classes && classes.length > 0 ? kpis : undefined}
      />

      {isLoading ? (
        <ClassesSkeleton />
      ) : isError ? (
        <DataError
          message="Impossible de charger la liste des classes."
          onRetry={() => refetch()}
        />
      ) : !classes || classes.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 py-12 text-center">
          <Users aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Aucune classe assignée pour le moment.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            Contactez l&apos;administration pour vérifier votre planning.
          </p>
        </div>
      ) : (
        <>
          {list.length > 3 && (
            <ListSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une classe ou une matière…"
              aria-label="Rechercher une classe"
            />
          )}
          {filtered.length === 0 ? (
            <p className="rounded-lg border bg-muted/30 py-10 text-center text-sm text-muted-foreground">
              Aucune classe ne correspond à « {search} ».
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((cls) => (
                <ClassCard key={cls.class_id} cls={cls} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ClassCard({ cls }: { cls: TeacherClass }) {
  const average = cls.general_average ?? null
  const totalEvals = cls.total_evaluations ?? 0
  return (
    <Card className={`border-0 shadow-sm ring-1 ring-border ${premiumCardHover}`}>
      <CardContent className="p-4 space-y-3">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm">{cls.class_name}</p>
            <p className="text-xs text-muted-foreground">{cls.subject_name}</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {cls.level_name}
          </Badge>
        </div>

        {/* Indicateurs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <Users aria-hidden="true" className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-bold tabular-nums">{cls.student_count}</p>
            <p className="text-[10px] text-muted-foreground">Élèves</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <GraduationCap aria-hidden="true" className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p
              className={`text-sm font-bold tabular-nums ${
                average === null
                  ? "text-muted-foreground"
                  : average >= 10
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
              }`}
            >
              {average !== null ? average.toFixed(2) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Moyenne</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <ClipboardList aria-hidden="true" className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-bold tabular-nums">{totalEvals}</p>
            <p className="text-[10px] text-muted-foreground">Évals</p>
          </div>
        </div>

        {/* Action — touch target h-11 mobile pour la fonction la plus utilisée
            (la prof gère les notes en plein soleil sur Itel S661). */}
        <Link
          href={`/teacher/grades/${cls.class_id}` as Route}
          aria-label={`Gérer les notes de ${cls.class_name} en ${cls.subject_name}`}
          className="flex h-11 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 sm:h-10 sm:text-xs"
        >
          Gérer les notes <ChevronRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

function ClassesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-lg" />
      ))}
    </div>
  )
}
