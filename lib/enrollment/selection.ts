/** Une ligne du journal des inscriptions, réduite à ce que la sélection regarde. */
export interface LigneSelectionnable {
  id: number
  status: string
}

/** Les statuts qu'on a le droit de valider. */
export const STATUTS_VALIDABLES: ReadonlySet<string> = new Set(["prospect", "en_validation"])

/**
 * Ce qu'on validera vraiment : les lignes cochées **et** affichées.
 *
 * Retenir les cases cochées telles quelles suffirait à valider des dossiers
 * passés à la page suivante, filtrés hors de la vue, ou validés entre-temps
 * par un collègue au guichet. On signe pour ce qu'on a sous les yeux, et
 * c'est le calcul qui doit le garantir : un commentaire ne le garantissait
 * pas, il l'affirmait seulement.
 */
export function selectionVisible(
  affichees: ReadonlyArray<LigneSelectionnable>,
  cochees: ReadonlySet<number>,
): LigneSelectionnable[] {
  return affichees.filter((l) => STATUTS_VALIDABLES.has(l.status) && cochees.has(l.id))
}
