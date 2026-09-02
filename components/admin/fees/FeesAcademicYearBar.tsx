"use client"

import {
  AcademicYearChip,
  AcademicYearNotice,
  AcademicYearScopeBar,
} from "@/components/shared/AcademicYearScopeBar"
import type { AcademicYear } from "@/lib/contracts/academic-year"

export const FeesAcademicYearChip = AcademicYearChip
export const FeesAcademicYearNotice = AcademicYearNotice

interface FeesAcademicYearBarProps {
  years: AcademicYear[] | undefined
  selectedYearId: number | undefined
  onSelect: (yearId: number) => void
  isLoading?: boolean
}

/**
 * Choix de l'année sur laquelle porte tout l'écran des frais.
 *
 * L'écran s'ouvrait sur la première année renvoyée par l'API, sans rien
 * afficher de ce choix. Une école y a saisi sa grille sur l'année précédente
 * sans le voir : les montants n'apparaissaient plus nulle part ailleurs, et
 * la grille de l'année en cours semblait avoir disparu.
 */
export function FeesAcademicYearBar({
  years,
  selectedYearId,
  onSelect,
  isLoading,
}: FeesAcademicYearBarProps) {
  const currentYear = (years ?? []).find((y) => y.is_current)

  return (
    <AcademicYearScopeBar
      years={years}
      selectedYearId={selectedYearId}
      onSelect={onSelect}
      isLoading={isLoading}
      selectId="fees-academic-year"
      currentHelper="Montants par niveau et frais optionnels affichés ci-dessous portent sur cette année."
      offYearWarning={
        `Ce n'est pas l'année en cours${currentYear ? ` (${currentYear.name})` : ""}. ` +
        "Ce qui est saisi ici ne s'appliquera pas aux inscriptions du moment."
      }
    />
  )
}
