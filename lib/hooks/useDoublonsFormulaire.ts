"use client"

import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { useCurrentAcademicYearId } from "./useCurrentAcademicYear"
import { useDoublons } from "./useDoublons"
import type { Correspondance } from "@/lib/contracts/duplicates"

/**
 * Les champs d'état civil que la détection compare.
 *
 * Les champs sont optionnels parce que les formulaires réels le sont aussi
 * (la modification de fiche est un schéma partiel). La contrainte de type est
 * donc faible : elle documente ce qui est lu, elle ne l'impose pas. Un écran
 * qui n'aurait aucun de ces champs compilerait et ne comparerait rien — c'est
 * le prix de la souplesse, et il vaut mieux le dire que le nier.
 */
export interface ChampsIdentite extends FieldValues {
  last_name?: string | null
  first_name?: string | null
  birth_date?: string | null
  enrollment_number?: string | null
}

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
): {
  correspondances: Correspondance[]
  enCours: boolean
  echec: boolean
  tronque: boolean
} {
  const { academicYearId } = useCurrentAcademicYearId()

  // On s'abonne aux seuls champs du signalement : `form.watch()` sans argument
  // redessine le formulaire entier à chaque touche de n'importe quel champ, et
  // la personne saisit sur un téléphone d'entrée de gamme.
  // Les noms et la destructuration sont sur le même écran : réordonner l'un
  // sans l'autre se voit. Une version antérieure gardait le tableau à trente
  // lignes de là et payait ce décalage par trois échappements de type.
  const [last_name, first_name, birth_date, enrollment_number] = form.watch([
    "last_name",
    "first_name",
    "birth_date",
    "enrollment_number",
  ] as Path<T>[]) as (string | null | undefined)[]

  const { data, isFetching, isError } = useDoublons({
    last_name: last_name ?? undefined,
    first_name: first_name ?? undefined,
    birth_date: birth_date ?? undefined,
    enrollment_number: enrollment_number ?? undefined,
    academic_year_id: academicYearId,
    ignorer_student_id: options.ignorerStudentId,
  })

  return {
    correspondances: data?.correspondances ?? [],
    // Sans ces deux-là, une vérification en cours et une vérification
    // impossible ressemblent toutes deux à « aucun doublon » — sur un
    // formulaire dont le seul objet est d'empêcher une erreur.
    enCours: isFetching,
    echec: isError,
    tronque: data?.tronque ?? false,
  }
}
