import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

const refetch = vi.fn()

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/timetable" }))

vi.mock("@/lib/hooks/useAcademicYears", () => ({
  useAcademicYears: () => ({ data: { items: [{ id: 3, is_current: true }] } }),
}))

vi.mock("@/lib/hooks/usePermissions", () => ({
  usePermissions: () => ({ has: () => true }),
}))

vi.mock("@/lib/hooks/useClasses", () => ({
  useInfiniteClasses: () => ({
    data: { items: [] },
    scrollInfini: { resteAcharger: false, chargeEnCours: false, chargerSuite: vi.fn() },
  }),
}))

vi.mock("@/lib/hooks/useScheduleEvents", () => ({
  useScheduleEvents: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error("Réponse inattendue du serveur"),
    refetch,
  }),
  useScheduleEventMutations: () => ({
    createMany: { mutateAsync: vi.fn(), isPending: false },
    update: { mutateAsync: vi.fn(), isPending: false },
    remove: { mutateAsync: vi.fn(), isPending: false },
  }),
}))

import { ScheduleEventsManager } from "./ScheduleEventsManager"

function ouvrir() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ScheduleEventsManager />
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByRole("button", { name: /Pauses et activités/ }))
}

describe("gestionnaire des pauses : chargement en échec", () => {
  beforeEach(() => refetch.mockClear())

  it("explique ce qui n'a pas chargé au lieu de n'afficher qu'un bouton", () => {
    ouvrir()
    expect(screen.getByText("Impossible de charger les pauses.")).toBeInTheDocument()
    expect(screen.queryByText("Aucune période définie.")).not.toBeInTheDocument()
  })

  it("relance le chargement depuis le bouton Réessayer", () => {
    ouvrir()
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
