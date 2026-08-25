"use client"

import { isSeriesSlotTaken, type AssignableInstance } from "@/lib/utils/subject-assignment"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AssignSeriesOption } from "./subject-assign-types"

interface TeacherOption {
  id: number
  first_name: string
  last_name: string
  speciality: string | null
}

interface DetailsValue {
  seriesId: number | null
  coef: number
  hours: number
  teacherId: number | null
}

interface DetailsHandlers {
  onSeriesChange: (value: number | null) => void
  onCoefChange: (value: number) => void
  onHoursChange: (value: number) => void
  onTeacherChange: (value: number | null) => void
}

interface Props {
  series: AssignSeriesOption[]
  levelInstances: AssignableInstance[]
  value: DetailsValue
  teachers: TeacherOption[]
  error: string | null
  handlers: DetailsHandlers
}

export function SubjectAssignDetailsForm({
  series,
  levelInstances,
  value,
  teachers,
  error,
  handlers,
}: Props) {
  return (
    <div className="space-y-4 py-2">
      {series.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Série (optionnel)</label>
          <Select
            value={value.seriesId?.toString() ?? "none"}
            onValueChange={(v) => handlers.onSeriesChange(v === "none" ? null : Number(v))}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Toutes séries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled={isSeriesSlotTaken(levelInstances, null)}>
                Toutes séries
              </SelectItem>
              {series.map((item) => (
                <SelectItem
                  key={item.id}
                  value={item.id.toString()}
                  disabled={isSeriesSlotTaken(levelInstances, item.id)}
                >
                  Série {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Enseignant</label>
        <Select
          value={value.teacherId?.toString() ?? "none"}
          onValueChange={(v) => handlers.onTeacherChange(v === "none" ? null : Number(v))}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Sélectionner un enseignant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun (à assigner plus tard)</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                {teacher.first_name} {teacher.last_name}
                {teacher.speciality ? ` (${teacher.speciality})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Coefficient</label>
          <Input
            type="number"
            min={1}
            value={value.coef}
            onChange={(e) => handlers.onCoefChange(Number(e.target.value) || 1)}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Heures / semaine</label>
          <Input
            type="number"
            min={1}
            value={value.hours}
            onChange={(e) => handlers.onHoursChange(Number(e.target.value) || 1)}
            className="h-11"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}