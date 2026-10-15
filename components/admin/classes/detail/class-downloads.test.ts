import { beforeEach, describe, expect, it, vi } from "vitest"

const apiFetchBlob = vi.hoisted(() => vi.fn(async () => new Blob(["pdf"])))
vi.mock("@/lib/api/client", () => ({ apiFetchBlob }))

import { fetchClassGradeSheet } from "./class-downloads"

describe("feuille de notes : requête PDF", () => {
  beforeEach(() => apiFetchBlob.mockClear())

  it("préserve le format paysage par défaut", async () => {
    await fetchClassGradeSheet(2)
    expect(apiFetchBlob).toHaveBeenCalledWith("/admin/classes/2/grade-sheet?orientation=landscape")
  })

  it("transmet l'orientation portrait au générateur backend", async () => {
    await fetchClassGradeSheet(2, "portrait")
    expect(apiFetchBlob).toHaveBeenCalledWith("/admin/classes/2/grade-sheet?orientation=portrait")
  })
})
