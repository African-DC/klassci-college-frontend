"use client"

import type { Route } from "next"
import Link from "next/link"
import { AlertTriangle, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/lib/hooks/usePermissions"

type Role = "admin" | "teacher" | "student" | "parent"

interface AcademicYearBannerProps {
  /** Label de l'année active (ex: "2025-2026") ou null/undefined si rien configuré. */
  currentYear: string | null | undefined
  /** Rôle utilisé pour adapter le message quand l'année manque. */
  role: Role
  className?: string
}

const MISSING_MESSAGE: Record<Role, string> = {
  admin: "Aucune année scolaire active.",
  teacher:
    "Aucune année scolaire n'est encore configurée. Contactez l'administration.",
  student:
    "Année scolaire non configurée par l'établissement. Vos données apparaîtront dès qu'elle sera créée.",
  parent:
    "Année scolaire non configurée par l'établissement. Le suivi de vos enfants apparaîtra dès qu'elle sera créée.",
}

export function AcademicYearBanner({
  currentYear,
  role,
  className,
}: AcademicYearBannerProps) {
  const { has } = usePermissions()
  const peutConfigurer = has("admin:academic-years:create")

  if (currentYear) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium text-primary",
          className,
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        Année {currentYear}
      </div>
    )
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 space-y-1">
        <p className="leading-snug">{MISSING_MESSAGE[role]}</p>
        {/* Le droit, pas le rôle. Une école qui confie la configuration des
            années à son secrétariat lui donne la permission ; sans cette
            lecture, le lien resterait invisible pour la personne qui en a
            désormais la charge, et visible pour un administrateur à qui on
            l'aurait retirée. */}
        {peutConfigurer && (
          <Link
            href={"/admin/academic-years" as Route}
            className="inline-flex font-medium text-amber-900 underline-offset-2 hover:underline dark:text-amber-100"
          >
            Configurer maintenant →
          </Link>
        )}
      </div>
    </div>
  )
}
