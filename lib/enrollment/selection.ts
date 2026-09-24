/** Une ligne du journal des inscriptions, réduite à ce que la sélection regarde. */
export interface LigneSelectionnable {
  id: number
  status: string
  /** L'inscription attend-elle un versement ? `null` ou absent : le serveur ne l'a pas dit. */
  awaiting_payment?: boolean | null
}

/** Les statuts qu'on a le droit de valider. */
export const STATUTS_VALIDABLES: ReadonlySet<string> = new Set(["prospect", "en_validation"])

/**
 * Ce qu'une ligne attend, dans l'ordre du guichet : encaisser, puis valider.
 *
 * Le serveur refuse la validation tant qu'un versement est attendu, et c'est
 * lui qui le dit (`awaiting_payment`) : le recalculer ici bloquait un
 * boursier exonéré sur « Encaisser » pour une dette nulle. Une réponse qui ne
 * le dit pas (`null`) ne propose rien plutôt que de deviner.
 */
export type ProchaineEtape = "encaisser" | "valider" | null

export function prochaineEtape(ligne: LigneSelectionnable): ProchaineEtape {
  if (!STATUTS_VALIDABLES.has(ligne.status)) return null
  if (ligne.awaiting_payment === true) return "encaisser"
  if (ligne.awaiting_payment === false) return "valider"
  return null
}

/**
 * Ce qu'on validera vraiment : les lignes cochées **et** affichées **et**
 * validables.
 *
 * Retenir les cases cochées telles quelles suffirait à valider des dossiers
 * passés à la page suivante, filtrés hors de la vue, ou validés entre-temps
 * par un collègue au guichet. On signe pour ce qu'on a sous les yeux, et
 * c'est le calcul qui doit le garantir : un commentaire ne le garantissait
 * pas, il l'affirmait seulement.
 */
export function selectionVisible<L extends LigneSelectionnable>(
  affichees: ReadonlyArray<L>,
  cochees: ReadonlySet<number>,
): L[] {
  return affichees.filter((l) => prochaineEtape(l) === "valider" && cochees.has(l.id))
}
