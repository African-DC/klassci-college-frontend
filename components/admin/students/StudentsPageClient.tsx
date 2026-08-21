"use client"

import { useRouter } from "next/navigation"
import { Plus, Users, UserCheck, UserPlus, School } from "lucide-react"
import { PageHero, heroAccentBtn, type HeroKpi } from "@/components/shared/PageHero"
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
 * - La barre de chips (Tous + une chip par classe + sans inscription validée) vit dans
 *   StudentsTable, alimentée par useStudentFilters().
 */
export function StudentsPageClient() {
  const router = useRouter()
  const { data: filters } = useStudentFilters()
  const [unenrolledChip, setUnenrolledChip] = useState(false)

  const total = filters?.total ?? 0
  const noCurrent = filters?.no_current_enrollment_count ?? 0
  const classesCount = filters?.by_class?.length ?? 0

  // `no_current_enrollment_count` compte tout ce qui n'est pas une inscription
  // VALIDÉE : les dossiers en cours de validation y sont mêlés aux élèves sans
  // aucun dossier. Le libellé le dit, plutôt que de laisser croire qu'aucune
  // démarche n'a été faite pour des élèves déjà en classe.
  const kpis: HeroKpi[] = [
    { label: "Élèves au total", value: total, icon: Users },
    { label: "Inscriptions validées", value: Math.max(total - noCurrent, 0), icon: UserCheck },
    { label: "En attente de validation", value: noCurrent, icon: UserPlus },
    { label: "Classes", value: classesCount, icon: School },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        icon={Users}
        title="Élèves"
        subtitle={
          <>
            {total} {total > 1 ? "élèves au total" : "élève au total"}
            {noCurrent > 0 && (
              <>
                {" · "}
                <button
                  type="button"
                  className="font-medium text-white underline underline-offset-2 hover:text-white/90"
                  onClick={() => setUnenrolledChip(true)}
                >
                  {noCurrent} à inscrire
                </button>
              </>
            )}
          </>
        }
        actions={
          <button
            type="button"
            className={heroAccentBtn}
            onClick={() => router.push("/admin/enrollments?action=create")}
          >
            <Plus className="h-4 w-4" />
            Nouvelle inscription
          </button>
        }
        kpis={kpis}
      />
      <StudentsTable initialUnenrolledOnly={unenrolledChip} onChipsConsumed={() => setUnenrolledChip(false)} />
    </div>
  )
}
