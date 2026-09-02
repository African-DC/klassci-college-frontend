import { afterEach, describe, expect, it, vi } from "vitest"
import { reprendreOu } from "./InKindBatchClient"

const CLE = "klassci.saisie-classe.derniere"

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe("par où l'éducateur reprend", () => {
  it("suit le lien quand il porte une classe", () => {
    window.localStorage.setItem(CLE, "7")
    // Le lien l'emporte : on vient de cliquer dessus, c'est le geste le plus
    // récent, et il désigne une intention plus précise qu'un souvenir.
    expect(reprendreOu("12")).toBe(12)
  })

  it("retombe sur la dernière classe ouverte", () => {
    window.localStorage.setItem(CLE, "7")
    expect(reprendreOu(null)).toBe(7)
  })

  it("ignore une valeur abîmée plutôt que de rendre NaN", () => {
    window.localStorage.setItem(CLE, "6e B")
    expect(reprendreOu(null)).toBeUndefined()
  })

  it("ignore un identifiant nul ou négatif", () => {
    expect(reprendreOu("0")).toBeUndefined()
    expect(reprendreOu("-3")).toBeUndefined()
  })

  it("survit à un stockage bloqué", () => {
    // Navigation privée, cookies refusés : `localStorage` jette à la lecture.
    // Se souvenir est un confort, pas une garantie — l'écran doit s'ouvrir.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("stockage bloqué")
    })
    expect(reprendreOu(null)).toBeUndefined()
  })

  it("rend undefined quand rien n'est mémorisé", () => {
    expect(reprendreOu(null)).toBeUndefined()
  })
})
