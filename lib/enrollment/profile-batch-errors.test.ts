/**
 * Un lot refusé se dit en noms d'élèves, et désigne les lignes à corriger.
 */
import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api/client"
import { ProfileBatchError } from "@/lib/api/enrollment-profile"
import { describeBatchFailure } from "./profile-batch-errors"

const names: Record<number, string> = { 41: "BAMBA Awa", 42: "KONÉ Awa", 43: "OUATTARA Ali" }
const nameOf = (id: number) => names[id] ?? `inscription ${id}`
const chunk = [41, 42, 43].map((enrollment_id) => ({ enrollment_id, is_repeater: true }))

describe("l'échec d'un enregistrement en lot", () => {
  it("remplace l'identifiant cité par le serveur par le nom de l'élève", () => {
    const reason = new ApiError("Inscription 42 : la LV2 n'existe pas en 6ème", 422, "x")
    const failure = describeBatchFailure(new ProfileBatchError(reason, 0, chunk), nameOf)
    expect(failure.title).toBe("Aucune modification enregistrée")
    expect(failure.faultyIds).toEqual([42])
    expect(failure.description).toContain("KONÉ Awa")
    expect(failure.description).not.toMatch(/\b42\b/)
    // Le « 6 » de « 6ème » ne désigne personne.
    expect(failure.faultyIds).not.toContain(6)
  })

  it("lit l'inscription fautive dans un 422 de validation", () => {
    const detail = [{ loc: ["body", "items", 2, "lv2"], msg: "valeur invalide" }]
    const reason = new ApiError("valeur invalide", 422, detail)
    const failure = describeBatchFailure(new ProfileBatchError(reason, 0, chunk), nameOf)
    expect(failure.faultyIds).toEqual([43])
  })

  it("annonce les élèves déjà enregistrés et à partir de qui ça a échoué", () => {
    const reason = new ApiError("Erreur 500", 500, null)
    const failure = describeBatchFailure(new ProfileBatchError(reason, 100, chunk), nameOf)
    expect(failure.title).toBe("100 élèves enregistrés, échec à partir de BAMBA Awa")
    expect(failure.faultyIds).toEqual([])
  })
})
