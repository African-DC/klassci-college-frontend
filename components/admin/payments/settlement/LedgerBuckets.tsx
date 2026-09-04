"use client"

import { ETATS } from "@/components/admin/payments/settlement/LedgerRows"
import {
  FilterChips,
  type ChipTone,
  type FilterChipOption,
} from "@/components/shared/list/FilterChips"
import type { LedgerStatus } from "@/lib/contracts/fee-category-ledger"

/** Le seau « tous les états », qui n'envoie aucun filtre au serveur. */
export const SEAU_TOUS = ""

/**
 * Les trois seaux toujours offerts, dans l'ordre du recouvrement : ce sur quoi
 * il y a quelque chose à faire vient en premier.
 */
const SEAUX: LedgerStatus[] = ["pending", "partial", "paid"]

/**
 * Ceux qui n'apparaissent que s'ils portent quelqu'un. Un seau « Exonéré » à
 * zéro sur une scolarité n'apprend rien ; sur une catégorie qui accepte les
 * dépôts, « Déposé en nature » est au contraire le cas normal, et l'omettre
 * rendrait ces lignes introuvables autrement que par « Tous ».
 */
const SEAUX_CONDITIONNELS: LedgerStatus[] = ["waived", "in_kind"]

/** La couleur suit celle de la pastille de ligne : même état, même signal. */
const TONS: Partial<Record<LedgerStatus, ChipTone>> = {
  pending: "destructive",
  partial: "warning",
}

/**
 * Le tri en seaux, au-dessus du tableau.
 *
 * **Les comptes viennent du serveur et portent sur le périmètre entier.** Tirés
 * de la page affichée, ils descendraient à chaque page tournée, et le document
 * exporté ne retomberait plus sur l'écran.
 *
 * **Un seul classement pour une seule question.** Le seau et la pastille de
 * ligne sortent du même état, celui que le serveur a posé sur la ligne de
 * frais. Côté v2, l'onglet comparait des montants pendant que le badge
 * arrondissait un pourcentage : un élève à 99,95 % s'affichait « À jour » dans
 * l'onglet « Partiels ». Rien ici ne recalcule un état.
 *
 * **Absent pour une caissière.** Le tri en seaux est un outil de recouvrement,
 * et le recouvrement se lit sur tout l'argent reçu : sans ce droit le serveur
 * ne rend pas de compteurs et refuse le filtre. L'appelant n'affiche alors rien
 * — une rangée de seaux vides se lirait comme « personne ne doit rien ».
 */
export function LedgerBuckets({
  compteurs,
  valeur,
  onChange,
}: {
  compteurs: Record<string, number>
  /** Le seau demandé, ou `SEAU_TOUS`. */
  valeur: string
  onChange: (seau: string) => void
}) {
  const compte = (etat: LedgerStatus) => compteurs[etat] ?? 0
  const options: FilterChipOption[] = [
    {
      value: SEAU_TOUS,
      label: "Tous",
      count: Object.values(compteurs).reduce((somme, n) => somme + n, 0),
    },
    ...[...SEAUX, ...SEAUX_CONDITIONNELS.filter((etat) => compte(etat) > 0)].map((etat) => ({
      value: etat,
      label: ETATS[etat].label,
      count: compte(etat),
      tone: TONS[etat],
    })),
  ]

  return (
    <FilterChips
      options={options}
      value={valeur}
      onChange={onChange}
      aria-label="Trier par état de la ligne"
    />
  )
}
