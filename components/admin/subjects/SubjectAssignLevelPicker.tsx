"use client"

import type { Level } from "@/lib/contracts/level"
import {
  instancesForLevel,
  isLevelAssignable,
  type AssignableInstance,
} from "@/lib/utils/subject-assignment"
import type { AssignSeriesOption } from "./subject-assign-types"

interface Props {
  levels: Level[]
  series: AssignSeriesOption[]
  instances: AssignableInstance[]
  onChoose: (levelId: number) => void
}

export function SubjectAssignLevelPicker({ levels, series, instances, onChoose }: Props) {
  if (levels.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aucun niveau n'est disponible.
      </p>
    )
  }

  return (
    <div className="max-h-72 space-y-1 overflow-y-auto py-1">
      {levels.map((level) => {
        const levelSeries = series.filter((item) => item.level_id === level.id)
        const levelInstances = instancesForLevel(instances, level.id)
        const available = isLevelAssignable(levelInstances, levelSeries)
        return (
          <button
            key={level.id}
            type="button"
            disabled={!available}
            onClick={() => onChoose(level.id)}
            className="flex h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="font-medium">{level.name}</span>
            {!available && (
              <span className="text-xs text-muted-foreground">Déjà assignée</span>
            )}
          </button>
        )
      })}
    </div>
  )
}