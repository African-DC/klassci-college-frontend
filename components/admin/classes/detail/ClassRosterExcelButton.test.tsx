import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
const download = vi.hoisted(() => vi.fn(async () => new Blob(["excel"])))
const trigger = vi.hoisted(() => vi.fn())
vi.mock("./class-downloads", () => ({
  fetchClassRosterExcel: download, triggerBlobDownload: trigger,
  fileSafeName: (name: string) => name.toLowerCase().split(" ").join("-"),
}))
import { ClassRosterExcelButton } from "./ClassRosterExcelButton"
describe("export Excel de classe", () => {
  it("transmet les filtres au backend pour toute la cohorte", async () => {
    render(<ClassRosterExcelButton classId={12} className="6e B" filters={{ genre: "M", assignments: ["affecte"] }} />)
    fireEvent.click(screen.getByRole("button", { name: /en Excel/ }))
    await waitFor(() => expect(download).toHaveBeenCalledWith(12, { genre: "M", assignments: ["affecte"] }))
    expect(trigger).toHaveBeenCalledWith(expect.any(Blob), "liste-classe-6e-b.xlsx")
  })
})
