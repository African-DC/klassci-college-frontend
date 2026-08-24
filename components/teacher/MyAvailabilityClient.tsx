"use client"

/**
 * L'enseignant déclare lui-même quand il n'est pas là.
 *
 * Même grille que celle de sa fiche côté administration : ce que l'un saisit,
 * l'autre le voit, et il n'y a qu'un seul geste à apprendre. Seule la voix
 * change — ici on s'adresse à l'intéressé, et sa semaine réelle s'affiche
 * au-dessus pour qu'il déclare en connaissance de ses cours.
 */

import { Info } from "lucide-react"
import { TeacherAvailabilityTab } from "@/components/admin/teachers/tabs/TeacherAvailabilityTab"
import { TeacherWeekPanel } from "@/components/timetable/TeacherWeekPanel"
import { useMyWeek } from "@/lib/hooks/useTimetable"
import { Card, CardContent } from "@/components/ui/card"

export function MyAvailabilityClient() {
  const { data: week, isLoading } = useMyWeek()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Mes disponibilités</h1>
        <p className="text-sm text-muted-foreground">
          Ce que le secrétariat verra avant de vous placer un cours
        </p>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-3 sm:p-4">
          <TeacherWeekPanel
            week={week}
            isLoading={isLoading}
            title="Ma semaine actuelle"
          />
        </CardContent>
      </Card>

      <TeacherAvailabilityTab
        intro={
          <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-muted-foreground">
              Ces plages valent pour{" "}
              <span className="font-medium text-foreground">toute l&apos;année</span>, jour de
              semaine par jour de semaine. Une fois qu&apos;une plage est déclarée, le
              secrétariat ne peut plus vous placer de cours en dehors. Pour une absence
              d&apos;un jour précis, faites plutôt une{" "}
              <span className="font-medium text-foreground">demande de congé</span>.
            </p>
          </div>
        }
      />
    </div>
  )
}
