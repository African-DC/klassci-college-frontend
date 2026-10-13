import { apiFetch, apiFetchBlob } from "@/lib/api/client"

export type TeacherExportMode = "directory" | "assignments"
export type TeacherExportFormat = "pdf" | "docx" | "xlsx"

export interface TeacherExportRequest {
  mode: TeacherExportMode
  academic_year_id: number | null
  class_ids: number[]
  level_ids: number[]
  series_ids: number[]
  subject_ids: number[]
  columns: string[]
  group: string
  orientation: "auto" | "portrait" | "landscape"
}

export interface FilterOption {
  id: number
  name: string
  level_id?: number | null
  series_id?: number | null
  current?: boolean
}

export interface TeacherExportOptions {
  years: FilterOption[]
  classes: FilterOption[]
  levels: FilterOption[]
  series: FilterOption[]
  subjects: FilterOption[]
  columns: Record<string, string>
  groups: Record<string, string>
}

export const teacherExportsApi = {
  options: () => apiFetch<TeacherExportOptions>("/admin/teachers/export-options"),
  generate: (request: TeacherExportRequest, format: TeacherExportFormat, preview = false) =>
    apiFetchBlob(`/admin/teachers/export/${format}${preview && format === "pdf" ? "?preview=true" : ""}`, {
      method: "POST",
      body: JSON.stringify(request),
    }),
}
