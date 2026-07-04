"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ClassOption {
  id: number
  name: string
  level_name?: string | null
  series_name?: string | null
}

interface SubjectOption {
  id: number
  name: string
}

interface GradesFiltersProps {
  classes: ClassOption[]
  subjects: SubjectOption[]
  classId: number | null
  subjectId: number | null
  trimester: number | null
  onClassChange: (id: number | null) => void
  onSubjectChange: (id: number | null) => void
  onTrimesterChange: (t: number | null) => void
}

export function GradesFilters({
  classes,
  subjects,
  classId,
  subjectId,
  trimester,
  onClassChange,
  onSubjectChange,
  onTrimesterChange,
}: GradesFiltersProps) {
  const noClass = classId === null

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[180px] flex-1">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Classe</label>
        <Select
          value={classId ? String(classId) : ""}
          onValueChange={(v) => onClassChange(v ? Number(v) : null)}
        >
          <SelectTrigger className="h-11 sm:h-10">
            <SelectValue placeholder="Choisir une classe" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
                {c.level_name ? ` · ${c.level_name}` : ""}
                {c.series_name ? ` · ${c.series_name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Matière</label>
        <Select
          value={subjectId ? String(subjectId) : "all"}
          onValueChange={(v) => onSubjectChange(v === "all" ? null : Number(v))}
          disabled={noClass}
        >
          <SelectTrigger className="h-11 sm:h-10">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les matières</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-32">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Trimestre</label>
        <Select
          value={trimester ? String(trimester) : "all"}
          onValueChange={(v) => onTrimesterChange(v === "all" ? null : Number(v))}
          disabled={noClass}
        >
          <SelectTrigger className="h-11 sm:h-10">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="1">T1</SelectItem>
            <SelectItem value="2">T2</SelectItem>
            <SelectItem value="3">T3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
