"use client"

import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { useCurrentAcademicYearId } from "./useCurrentAcademicYear"
import { useDoublons } from "./useDoublons"
import type { Correspondance } from "@/lib/contracts/duplicates"

/**
 * Les champs d'état civil que la détection compare.
 *
 * La contrainte est portée par le type du formulaire plutôt que par un cast :
 * un écran qui n'aurait pas ces champs est refusé à la compilation, au lieu de
 * livrer un signalement qui ne compare rien.
 */
export interface ChampsIdentite extends FieldValues {
  last_name?: string | null
  first_name?: string | null
  birth_date?: string | null
  birth_place?: string | null
  enrollment_number?: string | null
}

const CHAMPS_SURVEILLES = [
  "last_name",
  "first_name",
  "birth_date",
  "birth_place",
  "enrollment_number",
] as const

/**
 * Le branchement du signalement sur un formulaire d'élève.
 *
 * Les trois écrans qui créent ou modifient une fiche portaient chacun le même
 * bloc : le même `watch` de cinq champs, le même blanchiment en `undefined`, le
 * même commentaire recopié mot pour mot. Ils avaient déjà divergé là où ça
 * compte — l'écran de création d'élève ne passait pas l'année, donc le signal
 * pour lequel la fonctionnalité existe, « cet élève a déjà un dossier ouvert
 * cette année », n'y apparaissait jamais.
 *
 * L'année vient d'ici par défaut : aucun appelant n'a plus à y penser, et la
 * divergence redevient impossible.
 */
export function useDoublonsFormulaire<T extends ChampsIdentite>(
  form: UseFormReturn<T>,
  options: { ignorerStudentId?: number } = {},
): { correspondances: Correspondance[] } {
  const { academicYearId } = useCurrentAcademicYearId()

  // On s'abonne aux seuls champs du signalement : `form.watch()` sans argument
  // redessine le formulaire entier à chaque touche de n'importe quel champ, et
  // la personne saisit sur un téléphone d'entrée de gamme.
  const valeurs = form.watch(CHAMPS_SURVEILLES as unknown as Path<T>[])
  const [nom, prenom, naissance, lieu, matricule] = valeurs as (string | null | undefined)[]

  const { data } = useDoublons({
    last_name: nom ?? undefined,
    first_name: prenom ?? undefined,
    birth_date: naissance ?? undefined,
    birth_place: lieu ?? undefined,
    enrollment_number: matricule ?? undefined,
    academic_year_id: academicYearId,
    ignorer_student_id: options.ignorerStudentId,
  })

  return { correspondances: data?.correspondances ?? [] }
}
