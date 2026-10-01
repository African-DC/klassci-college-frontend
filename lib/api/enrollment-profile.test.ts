/**
 * Le lot de la saisie par classe part par tranches de 100. On observe les
 * appels réellement faits et ce que l'appelant apprend quand une tranche échoue.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProfileBatchItem } from "@/lib/contracts/enrollment-profile"

const apiFetch = vi.hoisted(() => vi.fn())
vi.mock("./client", async (original) => ({
  ...(await original<typeof import("./client")>()),
  apiFetch,
}))

import { ApiError } from "./client"
import { enrollmentProfileApi, ProfileBatchError } from "./enrollment-profile"

const items: ProfileBatchItem[] = Array.from({ length: 150 }, (_, i) => ({
  enrollment_id: i + 1,
  is_repeater: false,
}))

function body(call: number): { items: ProfileBatchItem[] } {
  return JSON.parse((apiFetch.mock.calls[call][1] as { body: string }).body)
}

describe("l'enregistrement en lot des renseignements", () => {
  beforeEach(() => apiFetch.mockReset())

  it("découpe 150 lignes en deux appels et additionne les mises à jour", async () => {
    apiFetch.mockResolvedValueOnce({ updated: 100 }).mockResolvedValueOnce({ updated: 50 })
    await expect(enrollmentProfileApi.updateBatch(items)).resolves.toEqual({ updated: 150 })
    expect(apiFetch).toHaveBeenCalledTimes(2)
    expect(body(0).items).toHaveLength(100)
    expect(body(1).items[0].enrollment_id).toBe(101)
  })

  it("dit ce qui était déjà enregistré quand la seconde tranche est refusée", async () => {
    const refus = new ApiError("Inscription 120 : LV2 interdite", 422, null)
    apiFetch.mockResolvedValueOnce({ updated: 100 }).mockRejectedValueOnce(refus)
    const error = await enrollmentProfileApi.updateBatch(items).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ProfileBatchError)
    const batch = error as ProfileBatchError
    expect(batch.updated).toBe(100)
    expect(batch.chunk[0].enrollment_id).toBe(101)
    expect(batch.reason).toBe(refus)
  })
})
