"use client"

import { usePermissions } from "@/lib/hooks/usePermissions"
import { InformationSheetExcelButton } from "./InformationSheetExcelButton"

/**
 * La fiche de renseignements parmi les documents de la classe.
 *
 * Même forme que les lignes PDF voisines, mais un seul bouton : ce document
 * n'existe qu'en Excel, parce que la comptabilité le retravaille.
 */
export function InformationSheetDocRow({ classId, className }: { classId: number; className: string }) {
  const { has } = usePermissions()
  if (!has("enrollments:read")) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">Fiche de renseignements</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Naissance, nationalité, statut, régime, qualité, LV2 et niveau antérieur :
          les valeurs connues sont reprises automatiquement. Complétez les données absentes
          dans les fiches élèves ou dans la saisie des renseignements par classe.
        </p>
      </div>
      <InformationSheetExcelButton classId={classId} className={className} />
    </div>
  )
}
