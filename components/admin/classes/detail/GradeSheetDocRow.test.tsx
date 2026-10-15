import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const fetchGradeSheet = vi.hoisted(() => vi.fn(async () => new Blob(["pdf"])))
const download = vi.hoisted(() => vi.fn())

vi.mock("./class-downloads", () => ({
  fetchClassGradeSheet: fetchGradeSheet,
  triggerBlobDownload: download,
  fileSafeName: (name: string) => name.toLowerCase().replace(/\s+/g, "-"),
}))

vi.mock("@/components/shared/PdfPreviewButton", () => ({
  PdfPreviewButton: ({ fetchBlob }: { fetchBlob: () => Promise<Blob> }) => (
    <button type="button" onClick={() => void fetchBlob()}>
      Aperçu
    </button>
  ),
}))

import { GradeSheetDocRow } from "./GradeSheetDocRow"

describe("feuille de notes : choix d'orientation", () => {
  it("conserve le paysage par défaut pour les exports existants", async () => {
    render(<GradeSheetDocRow classId={2} className="4e A" />)
    expect(screen.getByRole("button", { name: "Paysage" })).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(screen.getByRole("button", { name: "Aperçu" }))
    await waitFor(() => expect(fetchGradeSheet).toHaveBeenCalledWith(2, "landscape"))
  })

  it("utilise le portrait pour l'aperçu et le PDF téléchargé", async () => {
    render(<GradeSheetDocRow classId={2} className="4e A" />)
    fireEvent.click(screen.getByRole("button", { name: "Portrait" }))
    expect(screen.getByRole("button", { name: "Portrait" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/A4 vertical/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Aperçu" }))
    await waitFor(() => expect(fetchGradeSheet).toHaveBeenCalledWith(2, "portrait"))

    fireEvent.click(screen.getByRole("button", { name: /Télécharger la feuille de notes/ }))
    await waitFor(() => expect(download).toHaveBeenCalledWith(
      expect.any(Blob),
      "feuille-notes-4e-a-portrait.pdf",
    ))
  })

  it("peut revenir au paysage après avoir choisi le portrait", async () => {
    render(<GradeSheetDocRow classId={2} className="4e A" />)
    fireEvent.click(screen.getByRole("button", { name: "Portrait" }))
    fireEvent.click(screen.getByRole("button", { name: "Paysage" }))

    expect(screen.getByRole("button", { name: "Paysage" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/A4 horizontal/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Aperçu" }))
    await waitFor(() => expect(fetchGradeSheet).toHaveBeenCalledWith(2, "landscape"))
  })
})
