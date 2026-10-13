import { apiFetch, apiFetchBlob } from "./client"

export type TeacherExportColumn =
  | "name" | "speciality" | "subject" | "class" | "level" | "series"
  | "contract" | "gender" | "phone" | "email" | "source" | "cnps" | "authorization"

export type TeacherExportGroup = "subject" | "speciality" | "class" | "level" | "series" | "contract" | "none"
export type TeacherExportOrientation = "auto" | "portrait" | "landscape"
export type TeacherExportFormat = "preview-pdf" | "pdf" | "word" | "excel"

type Choice = { id: number; name: string }
export type TeacherExportOptionsResponse = {
  years: (Choice & { is_current: boolean })[]
  levels: Choice[]
  series: (Choice & { level_id: number })[]
  classes: (Choice & { level_id: number; series_id: number | null })[]
  subjects: (Choice & { level_id: number | null; series_id: number | null })[]
  columns: Record<TeacherExportColumn, string>
  groups: Record<TeacherExportGroup, string>
  default_columns: TeacherExportColumn[]
}

export type TeacherExportPayload = {
  academic_year_id: number | null
  search: string
  class_ids: number[]
  level_ids: number[]
  series_ids: number[]
  subject_ids: number[]
  teacher_ids: number[]
  contract_types: ("permanent" | "vacataire" | "fonctionnaire")[]
  columns: TeacherExportColumn[]
  group_by: TeacherExportGroup
  orientation: TeacherExportOrientation
  include_unassigned: boolean
  include_catalog: boolean
}

/**
 * Les quatre formats passent le même payload au backend. Aucun tableau construit
 * sur la page paginée : le serveur lit toutes les données du tenant.
 */
export const teacherExportsApi = {
  options: () => apiFetch<TeacherExportOptionsResponse>("/admin/teachers/exports/options"),
  generate: (format: TeacherExportFormat, selection: TeacherExportPayload) =>
    apiFetchBlob("/admin/teachers/exports/" + format, {
      method: "POST", body: JSON.stringify(selection),
    }),
}
