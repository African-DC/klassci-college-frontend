"use client"

import { useRouter } from "next/navigation"
import { Plus, Users, UserCheck, UserPlus, School } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { StudentsTable } from "./StudentsTable"
import { useStudentFilters } from "@/lib/hooks/useStudents"
import { useState } from "react"

/**
 * Page client de /admin/students (refonte Persona — issue #116).
 *
 * Choix design ultrathink :
 * - Drop des 3 KPI cards démographiques (info non-actionnable, en plus d'être
 *   bug-prone côté BE — total/garçons/filles affichaient 5/5/5).
 * - Replacement par un sous-titre compact « N élèves au total · M à inscrire »
 *   où M est cliquable pour filtrer la liste aux élèves sans inscription
 *   valide cette année — Wave style, chaque info = 1 tap vers l'action.
 * - La barre de chips (Tous + une chip par classe + À inscrire) vit dans
 *   StudentsTable, alimentée par useStudentFilters().
 */
export function StudentsPageClient() {
  const router = useRouter()
  const { data: filters } = useStudentFilters()
  const [unenrolledChip, setUnenrolledChip] = useState(false)

  const total = filters?.total ?? 0
  const noCurrent = filters?.no_current_enrollment_count ?? 0
  const classesCount = filters?.by_class?.length ?? 0

  const kpis: KpiItem[] = [
    { label: "Élèves au total", value: total, icon: Users, tone: "primary" },
    { label: "Inscrits", value: Math.max(total - noCurrent, 0), icon: UserCheck, tone: "emerald" },
    { label: "À inscrire", value: noCurrent, icon: UserPlus, tone: noCurrent > 0 ? "accent" : "default" },
    { label: "Classes", value: classesCount, icon: School, tone: "default" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users aria-hidden="true" className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl tracking-tight sm:text-2xl">Élèves</h1>
            <p className="text-sm text-muted-foreground">
              {total} {total > 1 ? "élèves au total" : "élève au total"}
              {noCurrent > 0 && (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="text-amber-700 underline-offset-2 hover:underline"
                    onClick={() => setUnenrolledChip(true)}
                  >
                    {noCurrent} à inscrire
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/admin/enrollments?action=create")}
          className="h-11 gap-2 sm:h-10"
        >
          <Plus className="h-4 w-4" />
          Nouvelle inscription
        </Button>
      </div>
      <KpiStrip items={kpis} />
      <StudentsTable initialUnenrolledOnly={unenrolledChip} onChipsConsumed={() => setUnenrolledChip(false)} />
    </div>
  )
}
