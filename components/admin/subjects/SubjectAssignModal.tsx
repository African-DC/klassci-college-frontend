"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { duplicateSubject } from "@/lib/api/subjects"
import { useTeachers } from "@/lib/hooks/useTeachers"
import type { Level } from "@/lib/contracts/level"
import {
  firstFreeSeriesSlot,
  instancesForLevel,
  isLevelAssignable,
  isSeriesSlotTaken,
  type AssignableInstance,
} from "@/lib/utils/subject-assignment"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubjectAssignDetailsForm } from "./SubjectAssignDetailsForm"
import { SubjectAssignLevelPicker } from "./SubjectAssignLevelPicker"
import type { AssignSeriesOption, AssignTarget } from "./subject-assign-types"

export type { AssignSeriesOption, AssignTarget }

interface Props {
  target: AssignTarget | null
  levels: Level[]
  series: AssignSeriesOption[]
  instances: AssignableInstance[]
  open: boolean
  onClose: () => void
  onAssigned?: (subjectName: string) => void
}

export function SubjectAssignModal({
  target,
  levels,
  series,
  instances,
  open,
  onClose,
  onAssigned,
}: Props) {
  const skipLevelStep = target?.levelId != null
  const [step, setStep] = useState<"level" | "details">(skipLevelStep ? "details" : "level")
  const [levelId, setLevelId] = useState<number | null>(target?.levelId ?? null)
  const [seriesId, setSeriesId] = useState<number | null>(target?.seriesId ?? null)
  const [coef, setCoef] = useState(target?.defaultCoef ?? 1)
  const [hours, setHours] = useState(target?.defaultHours ?? 2)
  const [teacherId, setTeacherId] = useState<number | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { data: teachersData } = useTeachers({ size: 100 })
  const teachers = teachersData?.items ?? []

  useEffect(() => {
    if (!open || !target) return
    setStep(target.levelId != null ? "details" : "level")
    setLevelId(target.levelId ?? null)
    setSeriesId(target.seriesId ?? null)
    setCoef(target.defaultCoef)
    setHours(target.defaultHours)
    setTeacherId(null)
    setError(null)
    setIsPending(false)
  }, [open, target])

  const selectedLevel = levels.find((level) => level.id === levelId) ?? null
  const levelSeries = useMemo(
    () => series.filter((item) => item.level_id === levelId),
    [series, levelId],
  )
  const levelInstances = useMemo(
    () => (levelId == null ? [] : instancesForLevel(instances, levelId)),
    [instances, levelId],
  )

  function chooseLevel(nextLevelId: number) {
    const nextSeries = series.filter((item) => item.level_id === nextLevelId)
    const nextInstances = instancesForLevel(instances, nextLevelId)
    if (!isLevelAssignable(nextInstances, nextSeries)) return
    const free = firstFreeSeriesSlot(nextInstances, nextSeries)
    setLevelId(nextLevelId)
    setSeriesId(free === undefined ? null : free)
    setStep("details")
    setError(null)
  }

  function handleSubmit() {
    if (!target || levelId == null) return
    if (isSeriesSlotTaken(levelInstances, seriesId)) {
      setError("Cette matière existe déjà dans ce niveau / cette série")
      return
    }
    setIsPending(true)
    setError(null)
    const payload: Parameters<typeof duplicateSubject>[0] = {
      subject_id: target.subjectId,
      level_id: levelId,
      coefficient: coef,
      hours_per_week: hours,
    }
    if (seriesId !== null) payload.series_id = seriesId
    if (teacherId !== null) payload.teacher_id = teacherId

    duplicateSubject(payload)
      .then(() => {
        const levelName = selectedLevel?.name ?? target.levelName ?? "ce niveau"
        toast.success(`${target.subjectName} assignée à ${levelName}`)
        queryClient.invalidateQueries({ queryKey: ["subjects"] })
        onAssigned?.(target.subjectName)
        onClose()
      })
      .catch((err: Error) => {
        setError(err.message)
      })
      .finally(() => setIsPending(false))
  }

  const title = skipLevelStep || step === "details"
    ? `Assigner à ${selectedLevel?.name ?? target?.levelName ?? "un niveau"}`
    : `Assigner ${target?.subjectName ?? "la matière"}`

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {step === "level"
              ? "Choisir le niveau où créer l'instance"
              : `Configurer ${target?.subjectName} pour ce niveau`}
          </DialogDescription>
        </DialogHeader>

        {step === "level" ? (
          <SubjectAssignLevelPicker
            levels={levels}
            series={series}
            instances={instances}
            onChoose={chooseLevel}
          />
        ) : (
          <SubjectAssignDetailsForm
            series={levelSeries}
            levelInstances={levelInstances}
            value={{ seriesId, coef, hours, teacherId }}
            teachers={teachers}
            error={error}
            handlers={{
              onSeriesChange: setSeriesId,
              onCoefChange: setCoef,
              onHoursChange: setHours,
              onTeacherChange: setTeacherId,
            }}
          />
        )}

        <DialogFooter>
          {step === "details" && !skipLevelStep ? (
            <Button variant="outline" onClick={() => setStep("level")}>Retour</Button>
          ) : (
            <Button variant="outline" onClick={onClose}>Annuler</Button>
          )}
          {step === "details" && (
            <Button onClick={handleSubmit} disabled={isPending || levelId == null}>
              {isPending ? "Assignation..." : "Assigner"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}