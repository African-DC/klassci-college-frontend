/**
 * La saisie par classe vide ses brouillons dans le rappel de succès. Ce rappel
 * ne doit passer qu'une fois la fiche rechargée, sinon l'écran réaffiche un
 * instant les anciennes valeurs, comme si rien n'avait été enregistré.
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

const updateBatch = vi.hoisted(() => vi.fn())
const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock("@/lib/api/enrollment-profile", async (original) => ({
  ...(await original<typeof import("@/lib/api/enrollment-profile")>()),
  enrollmentProfileApi: { updateBatch },
}))
vi.mock("sonner", () => ({ toast: toasts }))

import { ApiError } from "@/lib/api/client"
import { ProfileBatchError } from "@/lib/api/enrollment-profile"
import { useBatchUpdateEnrollmentProfiles } from "./useEnrollmentProfile"

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  let release!: () => void
  const refetched = new Promise<void>((resolve) => (release = resolve))
  const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockImplementation(() => refetched)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const nameOf = (id: number) => (id === 101 ? "KONÉ Awa" : `#${id}`)
  const { result } = renderHook(() => useBatchUpdateEnrollmentProfiles(nameOf), { wrapper })
  return { result, release, invalidate }
}

describe("l'enregistrement en lot", () => {
  it("ne rend la main qu'une fois la fiche rechargée", async () => {
    updateBatch.mockResolvedValueOnce({ updated: 2 })
    const { result, release, invalidate } = setup()
    const cleared = vi.fn()
    act(() => result.current.mutate([{ enrollment_id: 1 }], { onSuccess: cleared }))

    await waitFor(() => expect(invalidate).toHaveBeenCalled())
    expect(cleared).not.toHaveBeenCalled()
    release()
    await waitFor(() => expect(cleared).toHaveBeenCalledOnce())
  })

  it("dit honnêtement ce qui est déjà parti quand une tranche échoue", async () => {
    const reason = new ApiError("Erreur 500", 500, null)
    updateBatch.mockRejectedValueOnce(
      new ProfileBatchError(reason, 100, [{ enrollment_id: 101 }, { enrollment_id: 102 }]),
    )
    const { result, release, invalidate } = setup()
    release()
    act(() => result.current.mutate([{ enrollment_id: 1 }]))

    await waitFor(() => expect(toasts.error).toHaveBeenCalled())
    expect(toasts.error.mock.calls[0][0]).toBe("100 élèves enregistrés, échec à partir de KONÉ Awa")
    // Les 100 premiers sont en base : la fiche est rechargée pour les retirer des brouillons.
    expect(invalidate).toHaveBeenCalled()
  })
})
