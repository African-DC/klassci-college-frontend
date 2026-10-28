/**
 * Rostan, en production : chaque niveau portait déjà une matière, et glisser
 * une deuxième matière du catalogue répondait « Cette matière existe déjà dans
 * ce niveau / cette série » sans même appeler le serveur. La fenêtre comparait
 * toutes les matières du niveau au lieu de la seule matière glissée.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"

const duplicate = vi.hoisted(() => vi.fn())

vi.mock("@/lib/api/subjects", () => ({ duplicateSubject: duplicate }))
vi.mock("@/lib/hooks/useTeachers", () => ({ useTeachers: () => ({ data: { items: [] } }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { SubjectAssignModal } from "./SubjectAssignModal"

const SIXIEME = { id: 1, name: "6eme", order: 1 } as never

function ouvrir(subjectName: string, instances: { name: string; level_id: number; series_id: number | null }[]) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SubjectAssignModal
        target={{ subjectId: 9, subjectName, levelId: 1, levelName: "6eme", seriesId: null, defaultCoef: 2, defaultHours: 3 }}
        levels={[SIXIEME]}
        series={[]}
        instances={instances}
        open
        onClose={() => {}}
      />
    </QueryClientProvider>,
  )
}

describe("assigner une matière à un niveau", () => {
  it("accepte une matière quand le niveau n'en porte qu'une autre", async () => {
    duplicate.mockResolvedValueOnce({})
    ouvrir("Français", [{ name: "Mathématiques", level_id: 1, series_id: null }])

    fireEvent.click(screen.getByRole("button", { name: "Assigner" }))

    await waitFor(() => expect(duplicate).toHaveBeenCalledOnce())
    expect(duplicate.mock.calls[0][0]).toMatchObject({ subject_id: 9, level_id: 1 })
    expect(screen.queryByText(/existe déjà/)).toBeNull()
  })

  it("refuse toujours la même matière déjà posée sur ce niveau", () => {
    duplicate.mockClear()
    ouvrir("Français", [{ name: "Français", level_id: 1, series_id: null }])

    fireEvent.click(screen.getByRole("button", { name: "Assigner" }))

    expect(screen.getByText("Cette matière existe déjà dans ce niveau / cette série")).toBeTruthy()
    expect(duplicate).not.toHaveBeenCalled()
  })
})
