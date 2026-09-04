import { afterEach, describe, expect, it, vi } from "vitest"
import { handoffRank, hasCoarsePointer } from "./handoff-rank"

describe("handoffRank", () => {
  it("met le code QR au premier rang quand le poste n'a pas de caméra", () => {
    // Le fixe du secrétariat, ou n'importe quel poste servi en HTTP simple :
    // le téléphone est le seul chemin vers une photo.
    expect(handoffRank({ camera: false, coarsePointer: false })).toBe("prominent")
  })

  it("garde le premier rang sur un écran tactile sans caméra", () => {
    // Un moniteur tactile de comptoir existe ; il n'a pas d'objectif pour
    // autant, et c'est la caméra qui décide, pas le doigt.
    expect(handoffRank({ camera: false, coarsePointer: true })).toBe("prominent")
  })

  it("efface le bouton sur un appareil tenu en main qui a une caméra", () => {
    // Le téléphone que le code appellerait est celui qui affiche le code.
    expect(handoffRank({ camera: true, coarsePointer: true })).toBe("hidden")
  })

  it("laisse le bouton au second rang sur un portable avec webcam", () => {
    // La caméra directe reste le geste par défaut ; le téléphone rend une
    // meilleure photo, et on laisse le choix sans l'imposer.
    expect(handoffRank({ camera: true, coarsePointer: false })).toBe("second")
  })
})

describe("hasCoarsePointer", () => {
  const matchMediaInitial = window.matchMedia

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: matchMediaInitial,
    })
  })

  it("lit la requête média du pointeur", () => {
    const matchMedia = vi.fn(() => ({ matches: true }) as unknown as MediaQueryList)
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: matchMedia,
    })
    expect(hasCoarsePointer()).toBe(true)
    expect(matchMedia).toHaveBeenCalledWith("(pointer: coarse)")
  })

  it("répond « non » quand matchMedia manque, plutôt que de lever", () => {
    // Se tromper dans ce sens n'offre qu'un bouton de trop ; se tromper dans
    // l'autre retirerait le seul chemin d'un poste sans caméra.
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: undefined,
    })
    expect(hasCoarsePointer()).toBe(false)
  })
})
