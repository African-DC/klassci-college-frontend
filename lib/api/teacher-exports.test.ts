import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TeacherExportPayload } from "./teacher-exports"

const { apiFetch, apiFetchBlob } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  apiFetchBlob: vi.fn(),
}))

vi.mock("./client", () => ({ apiFetch, apiFetchBlob }))

import { teacherExportsApi } from "./teacher-exports"

const selection: TeacherExportPayload = {
  academic_year_id: 12,
  search: "Koné",
  class_ids: [4, 5],
  level_ids: [2],
  series_ids: [],
  subject_ids: [17, 21],
  teacher_ids: [],
  contract_types: [],
  columns: ["name"],
  group_by: "subject",
  orientation: "portrait",
  include_unassigned: false,
  include_catalog: true,
}

describe("exports enseignants", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("charge les options du tenant, pas la page paginée de 20 professeurs", async () => {
    apiFetch.mockResolvedValue({ classes: [], subjects: [] })
    await teacherExportsApi.options()
    expect(apiFetch).toHaveBeenCalledWith("/admin/teachers/exports/options")
  })

  it.each(["preview-pdf", "pdf", "word", "excel"] as const)(
    "transmet la même sélection au backend pour %s",
    async (format) => {
      const blob = new Blob(["test"])
      apiFetchBlob.mockResolvedValue(blob)
      await expect(teacherExportsApi.generate(format, selection)).resolves.toBe(blob)
      expect(apiFetchBlob).toHaveBeenCalledWith(
        "/admin/teachers/exports/" + format,
        { method: "POST", body: JSON.stringify(selection) },
      )
    },
  )
})
