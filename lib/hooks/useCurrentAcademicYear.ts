import { useAcademicYears } from "./useAcademicYears"

/**
 * L'annee sur laquelle un ecran doit s'ouvrir.
 *
 * L'annee courante est celle que l'etablissement a marquee comme telle, pas la
 * premiere de la liste. Les deux different des qu'une annee suivante est creee
 * pour preparer les inscriptions : l'ecran s'ouvrait alors sur une annee sans
 * donnees, sous un en-tete qui en annoncait une autre, et on croyait l'ecran
 * casse. Le repli sur la premiere ne sert qu'a un etablissement qui n'a rien
 * marque du tout.
 *
 * `override` est le choix explicite de l'utilisateur : il gagne toujours.
 */
export function useCurrentAcademicYearId(override?: number) {
  const { data, isLoading } = useAcademicYears()
  const years = data?.items
  return {
    academicYearId: override ?? years?.find((y) => y.is_current)?.id ?? years?.[0]?.id,
    years,
    isLoading,
  }
}
