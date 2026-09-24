/**
 * On ne valide que ce qu'on a sous les yeux.
 *
 * La sélection était un `Set` d'identifiants que rien ne remettait à zéro :
 * cocher trois lignes page 1, passer page 2 et cliquer « Valider » envoyait
 * trois dossiers que la personne ne voyait plus. Le commentaire du code
 * affirmait pourtant que la sélection ne survivait pas au changement de page.
 */

import { describe, expect, it } from "vitest"
import { prochaineEtape, selectionVisible } from "./selection"

const page1 = [
  { id: 1, status: "prospect", awaiting_payment: false },
  { id: 2, status: "en_validation", awaiting_payment: false },
  { id: 3, status: "valide", awaiting_payment: false },
]
const page2 = [
  { id: 10, status: "prospect", awaiting_payment: false },
  { id: 11, status: "prospect", awaiting_payment: false },
]

describe("ce qui part au serveur quand on valide une sélection", () => {
  it("ne retient que les lignes cochées et affichées", () => {
    expect(selectionVisible(page1, new Set([1, 2])).map((l) => l.id)).toEqual([1, 2])
  })

  it("oublie ce qui a changé de page", () => {
    // Coché page 1, puis on tourne la page : plus rien à valider ici.
    expect(selectionVisible(page2, new Set([1, 2]))).toEqual([])
  })

  it("oublie ce qu'un collègue vient de valider", () => {
    // La liste se recharge, la ligne 1 est passée « valide » : l'envoyer
    // reviendrait à demander une action déjà faite, et à récolter un refus
    // qui inquiéterait pour rien.
    const rechargee = [{ id: 1, status: "valide", awaiting_payment: false }, { id: 2, status: "prospect", awaiting_payment: false }]
    expect(selectionVisible(rechargee, new Set([1, 2])).map((l) => l.id)).toEqual([2])
  })

  it("ne propose jamais une ligne déjà validée", () => {
    expect(selectionVisible(page1, new Set([3]))).toEqual([])
  })

  it("ne renvoie rien quand rien n'est coché", () => {
    expect(selectionVisible(page1, new Set())).toEqual([])
  })
})

describe("ce qu'une ligne attend au guichet", () => {
  it("demande d'encaisser tant qu'aucun versement n'est reçu", () => {
    expect(prochaineEtape({ id: 1, status: "prospect", awaiting_payment: true })).toBe("encaisser")
  })

  it("propose de valider une fois le versement reçu", () => {
    expect(prochaineEtape({ id: 1, status: "prospect", awaiting_payment: false })).toBe("valider")
  })

  it("ne devine rien quand le serveur ne dit pas si un versement est attendu", () => {
    expect(prochaineEtape({ id: 1, status: "en_validation", awaiting_payment: null })).toBeNull()
  })

  it("n'attend plus rien d'une inscription déjà validée", () => {
    expect(prochaineEtape({ id: 1, status: "valide", awaiting_payment: false })).toBeNull()
  })

  it("n'envoie pas à la validation groupée un dossier sans versement", () => {
    const lignes = [
      { id: 1, status: "prospect", awaiting_payment: true },
      { id: 2, status: "prospect", awaiting_payment: false },
    ]
    expect(selectionVisible(lignes, new Set([1, 2])).map((l) => l.id)).toEqual([2])
  })
})
