"use client"

import { useScrollSentinel } from "@/lib/hooks/useScrollSentinel"

interface RegisterFooterProps {
  total: number
  /** Fourni par `useListeInfinie` : remplace les boutons par la sentinelle. */
  scrollInfini?: {
    chargerSuite: () => void
    resteAcharger: boolean
    chargeEnCours: boolean
  }
  /** Combien de lignes sont affichées, pour un pied qui ne ment pas. */
  charges?: number
  /** « convocation » / « billet » — accordé au singulier, pluriel ajouté ici. */
  noun: string
}

/**
 * Pied de registre : ce qui est affiché, face à ce que l'établissement compte.
 *
 * Les deux registres de vie scolaire s'empilent d'une année sur l'autre et ne
 * sont jamais purgés. Ils arrivent donc par pages au fil du défilement, et le
 * total répond à la question que les lignes visibles ne peuvent pas trancher :
 * combien y en a-t-il en tout. Le composant s'appelait `RegisterPagination`
 * quand il portait des boutons de page ; il n'en porte plus.
 */
export function RegisterFooter({
  total,
  scrollInfini,
  charges,
  noun,
}: RegisterFooterProps) {
  const sentinelle = useScrollSentinel({
    actif: Boolean(scrollInfini?.resteAcharger) && !scrollInfini?.chargeEnCours,
    onApproche: () => scrollInfini?.chargerSuite(),
  })

  // Le registre défile : la sentinelle tire la suite, et le pied dit ce qui
  // est affiché face à ce que le serveur annonce. Un total seul laisserait
  // croire que tout est là.
  if (scrollInfini) {
    const affiches = charges ?? total
    return (
      <>
        <div ref={sentinelle} aria-hidden="true" className="h-px" />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {scrollInfini.chargeEnCours
            ? "Chargement…"
            : scrollInfini.resteAcharger
              ? `${affiches} ${noun}${affiches > 1 ? "s" : ""} sur ${total}`
              : `${total} ${noun}${total > 1 ? "s" : ""}, tout est affiché`}
        </p>
      </>
    )
  }

  return (
    <p className="text-xs text-muted-foreground">
      {total} {noun}
      {total > 1 ? "s" : ""}
    </p>
  )
}
