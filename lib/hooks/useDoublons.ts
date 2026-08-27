"use client"

import { useQuery } from "@tanstack/react-query"
import { duplicatesApi } from "@/lib/api/duplicates"
import type { DoublonsParams } from "@/lib/contracts/duplicates"
import { useDebounce } from "./useDebounce"

/** En dessous, il n'y a pas de quoi interroger le serveur. */
const LONGUEUR_MINIMALE = 3

/**
 * Cherche les doublons pendant que la personne saisit.
 *
 * La recherche est temporisée : interroger le serveur à chaque touche coûterait
 * une requête par lettre, sur une connexion qui n'est pas la nôtre. Elle ne part
 * qu'à partir de trois caractères, faute de quoi « KO » remonterait la moitié de
 * l'établissement et le signalement deviendrait du bruit qu'on apprend à
 * ignorer.
 */
export function useDoublons(params: DoublonsParams, actif = true) {
  // Tous les champs saisis au clavier sont temporisés, pas seulement les trois
  // qui décident du déclenchement.
  const nom = useDebounce(params.last_name ?? "", 400)
  const prenom = useDebounce(params.first_name ?? "", 400)
  const matricule = useDebounce(params.enrollment_number ?? "", 400)
  const naissance = useDebounce(params.birth_date ?? "", 400)
  const lieu = useDebounce(params.birth_place ?? "", 400)

  const assezSaisi =
    nom.trim().length >= LONGUEUR_MINIMALE ||
    prenom.trim().length >= LONGUEUR_MINIMALE ||
    matricule.trim().length >= LONGUEUR_MINIMALE

  const requete: DoublonsParams = {
    academic_year_id: params.academic_year_id,
    ignorer_student_id: params.ignorer_student_id,
    last_name: nom || undefined,
    first_name: prenom || undefined,
    enrollment_number: matricule || undefined,
    birth_date: naissance || undefined,
    birth_place: lieu || undefined,
  }

  return useQuery({
    queryKey: ["doublons", requete] as const,
    queryFn: () => duplicatesApi.chercher(requete),
    enabled: actif && assezSaisi,
    staleTime: 1000 * 30,
    // Une erreur ici ne doit pas empêcher de créer un élève : le signalement
    // est une aide, pas une condition.
    retry: false,
  })
}
