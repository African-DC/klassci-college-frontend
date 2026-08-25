/**
 * L'aplatissement d'une liste chargée par pages.
 *
 * Deux propriétés portent tout l'écran : `items` doit contenir **toutes** les
 * pages tirées, et `total` doit rester celui du serveur. Les confondre est le
 * défaut naturel ici — on prend `items.length` pour le compte — et il produit
 * un pied qui annonce « 40 résultats » sur une base qui en a 312, juste après
 * qu'une secrétaire a filtré pour vérifier qu'il n'en manque aucun.
 *
 * Le test porte sur la fonction d'aplatissement, appelée telle qu'elle l'est
 * dans le hook, plutôt que sur le rendu d'un composant : c'est là que la
 * confusion se joue.
 */

import { describe, expect, it } from "vitest"
import { pageSuivante } from "./pagination"

/** L'aplatissement du hook, isolé pour être exercé. */
function aplatir<T>(pages: { items: T[]; size: number; total: number }[]) {
  return pages.length
    ? { ...pages[0], items: pages.flatMap((page) => page.items) }
    : undefined
}

const page = (items: number[], total: number) => ({ items, size: 20, total })

describe("une liste chargée au fil du défilement", () => {
  it("empile toutes les pages tirées", () => {
    const aplatie = aplatir([page([1, 2, 3], 312), page([4, 5], 312)])
    expect(aplatie?.items).toEqual([1, 2, 3, 4, 5])
  })

  it("garde le total du serveur, jamais le nombre de lignes chargées", () => {
    // La propriété qui empêche le pied de mentir.
    const aplatie = aplatir([page([1, 2, 3], 312)])
    expect(aplatie?.total).toBe(312)
    expect(aplatie?.total).not.toBe(aplatie?.items.length)
  })

  it("ne rend rien tant qu'aucune page n'est arrivée", () => {
    expect(aplatir([])).toBeUndefined()
  })

  it("s'arrête sur une page courte, pas sur le total annoncé", () => {
    // Le total bouge entre deux requêtes : une inscription est créée pendant
    // qu'on descend. S'y fier ferait boucler sur une page vide.
    expect(pageSuivante({ items: new Array(20).fill(0), size: 20 }, 1)).toBe(2)
    expect(pageSuivante({ items: [1, 2], size: 20 }, 1)).toBeUndefined()
  })
})
