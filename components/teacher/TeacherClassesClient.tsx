"use client"

import Link from "next/link"
import type { Route } from "next"
import {
  Users,
  GraduationCap,
  ClipboardList,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useTeacherClasses } from "@/lib/hooks/useTeacherPortal"
import type { TeacherClass } from "@/lib/contracts/teacher-portal"

export function TeacherClassesClient() {
  const { data: classes, isLoading, isError, refetch } = useTeacherClasses()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Mes classes</h1>
        <p className="text-sm text-muted-foreground">
          Classes assignées et statistiques
        </p>
      </div>

      {isLoading ? (
        <ClassesSkeleton />
      ) : isError ? (
        <DataError
          message="Impossible de charger la liste des classes."
          onRetry={() => refetch()}
        />
      ) : !classes || classes.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Aucune classe assignée.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <ClassCard key={cls.class_id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClassCard({ cls }: { cls: TeacherClass }) {
  const average = cls.general_average ?? null
  const totalEvals = cls.total_evaluations ?? 0
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
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
            <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-bold">{cls.student_count}</p>
            <p className="text-[10px] text-muted-foreground">Élèves</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <GraduationCap className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p
              className={`text-sm font-bold ${
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
            <ClipboardList className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-bold">{totalEvals}</p>
            <p className="text-[10px] text-muted-foreground">Évals</p>
          </div>
        </div>

        {/* Action */}
        <Link
          href={`/teacher/grades/${cls.class_id}` as Route}
          className="flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          Gérer les notes <ChevronRight className="h-3 w-3" />
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
