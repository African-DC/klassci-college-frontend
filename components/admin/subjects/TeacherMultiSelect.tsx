"use client"

import { useMemo } from "react"
import { useTeachers } from "@/lib/hooks/useTeachers"
import { MultiCombobox } from "@/components/shared/MultiCombobox"
import type { MultiComboboxOption } from "@/components/shared/multi-combobox-utils"
import type { SubjectTeacher } from "@/lib/contracts/subject"

interface Props {
  value: number[]
  onChange: (ids: number[]) => void
  /** Enseignants déjà liés à la matière : affichés même si la liste n'est pas encore chargée. */
  knownTeachers?: SubjectTeacher[]
  disabled?: boolean
  id?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
}

function buildOptions(
  teachers: { id: number; first_name: string; last_name: string; speciality: string | null }[],
  known: SubjectTeacher[],
): MultiComboboxOption<number>[] {
  const fromApi = teachers.map((t) => ({
    value: t.id,
    label: `${t.first_name} ${t.last_name}`,
    hint: t.speciality ?? undefined,
  }))
  const apiIds = new Set(teachers.map((t) => t.id))
  const missing = known
    .filter((t) => !apiIds.has(t.id))
    .map((t) => ({ value: t.id, label: t.full_name }))
  return [...fromApi, ...missing]
}

export function TeacherMultiSelect({ value, onChange, knownTeachers = [], disabled, ...aria }: Props) {
  const { data, isLoading, isError, refetch } = useTeachers({ size: 100 })
  const options = useMemo(
    () => buildOptions(data?.items ?? [], knownTeachers),
    [data, knownTeachers],
  )

  return (
    <MultiCombobox<number>
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Sélectionner des enseignants"
      searchPlaceholder="Rechercher un enseignant…"
      emptyText="Aucun enseignant disponible"
      loadingText="Chargement des enseignants…"
      loading={isLoading}
      error={isError ? "Impossible de charger les enseignants." : null}
      onRetry={() => void refetch()}
      disabled={disabled}
      {...aria}
    />
  )
}
