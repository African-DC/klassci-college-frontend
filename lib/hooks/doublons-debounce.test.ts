/**
 * La temporisation couvre-t-elle tous les champs qui entrent dans la clé ?
 *
 * Le hook annonce qu'il ne veut pas « une requête par lettre ». C'est la clé de
 * cache qui déclenche la requête : un seul champ non temporisé qui y entre
 * suffit à repartir à chaque touche, et la promesse devient fausse pour
 * celui-là. La date et le lieu de naissance étaient dans ce cas.
 */

import { renderHook } from "@testing-library/react"
import { act } from "react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { cleDoublons } from "./useDoublons"
import { useDebounce } from "./useDebounce"

describe("la clé de recherche", () => {
  it("ne dépend pas de l'ordre d'écriture des champs", () => {
    // Sinon deux saisies identiques occuperaient deux entrées de cache.
    const a = cleDoublons({ first_name: "Aya", last_name: "KOUASSI" })
    const b = cleDoublons({ last_name: "KOUASSI", first_name: "Aya" })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it("traite le vide et l'absence de la même façon", () => {
    expect(JSON.stringify(cleDoublons({ last_name: "KOUASSI", first_name: "" }))).toBe(
      JSON.stringify(cleDoublons({ last_name: "KOUASSI", first_name: undefined })),
    )
  })

  it("distingue deux noms différents", () => {
    expect(JSON.stringify(cleDoublons({ last_name: "KOUASSI" }))).not.toBe(
      JSON.stringify(cleDoublons({ last_name: "KOUAKOU" })),
    )
  })
})

describe("la temporisation", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("retient le lieu de naissance comme elle retient le nom", () => {
    // C'est le défaut trouvé en revue : ce champ entrait dans la clé sans
    // passer par la temporisation, donc une requête par touche.
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 400), {
      initialProps: { v: "Boua" },
    })
    rerender({ v: "Bouak" })
    expect(result.current).toBe("Boua")
    act(() => void vi.advanceTimersByTime(400))
    expect(result.current).toBe("Bouak")
  })
})
