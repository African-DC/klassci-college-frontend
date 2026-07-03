"use client"

import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { timetableApi } from "@/lib/api/timetable"
import { timetableKeys, useTeacherAvailabilities } from "@/lib/hooks/useTimetable"
import type { DayOfWeek } from "@/lib/contracts/timetable"
import {
  AvailabilityGrid,
} from "@/components/admin/teachers/availability/AvailabilityGrid"
import {
  AvailabilityLegend,
  AvailabilityToolbar,
} from "@/components/admin/teachers/availability/AvailabilityToolbar"
import {
  CellState,
  DAYS,
  HOURS,
  NEXT_STATE,
  PendingChange,
  buildSavedMap,
  cellKey,
} from "@/components/admin/teachers/availability/availability-helpers"

interface TeacherAvailabilityTabProps {
  teacherId: number
}

export function TeacherAvailabilityTab({ teacherId }: TeacherAvailabilityTabProps) {
  const queryClient = useQueryClient()
  const { data: availabilities, isLoading } = useTeacherAvailabilities(teacherId)

  const [editMode, setEditMode] = useState(false)
  const [pending, setPending] = useState<Map<string, PendingChange>>(new Map())
  const [saving, setSaving] = useState(false)

  const savedMap = useMemo(() => buildSavedMap(availabilities ?? []), [availabilities])

  const getDisplayState = useCallback(
    (day: DayOfWeek, start: string, end: string): CellState => {
      const key = cellKey(day, start, end)
      const p = pending.get(key)
      if (p) return p.target
      const s = savedMap.get(key)
      return s?.state ?? "unavailable"
    },
    [pending, savedMap],
  )

  const isPendingCell = useCallback(
    (day: DayOfWeek, start: string, end: string) =>
      pending.has(cellKey(day, start, end)),
    [pending],
  )

  const handleToggle = useCallback(
    (day: DayOfWeek, start: string, end: string) => {
      if (!editMode || saving) return
      const key = cellKey(day, start, end)
      const current = getDisplayState(day, start, end)
      const next = NEXT_STATE[current]
      const saved = savedMap.get(key)

      setPending((prev) => {
        const m = new Map(prev)
        if (saved && next === saved.state) {
          m.delete(key)
          return m
        }
        if (!saved && next === "unavailable") {
          m.delete(key)
          return m
        }
        let change: PendingChange
        if (!saved) {
          change = {
            kind: "create",
            target: next as Exclude<CellState, "unavailable">,
          }
        } else if (next === "unavailable") {
          change = { kind: "delete", existingId: saved.id, target: "unavailable" }
        } else {
          change = { kind: "update", existingId: saved.id, target: next }
        }
        m.set(key, change)
        return m
      })
    },
    [editMode, saving, getDisplayState, savedMap],
  )

  const handleCancel = useCallback(() => {
    setPending(new Map())
    setEditMode(false)
  }, [])

  const handleSave = useCallback(async () => {
    if (pending.size === 0) {
      setEditMode(false)
      return
    }
    setSaving(true)

    const operations: Promise<unknown>[] = []
    for (const [key, change] of pending) {
      const [day, start, end] = key.split("|") as [DayOfWeek, string, string]
      if (change.kind === "create") {
        operations.push(
          timetableApi.createAvailability(teacherId, {
            day,
            start_time: start,
            end_time: end,
            available: true,
            preferred: change.target === "preferred",
          }),
        )
      } else if (change.kind === "delete") {
        operations.push(timetableApi.deleteAvailability(change.existingId))
      } else {
        operations.push(
          timetableApi.updateAvailability(change.existingId, {
            available: true,
            preferred: change.target === "preferred",
          }),
        )
      }
    }

    const results = await Promise.allSettled(operations)
    const fulfilled = results.filter((r) => r.status === "fulfilled").length
    const rejected = results.length - fulfilled

    if (rejected === 0) {
      toast.success(
        `${fulfilled} disponibilité${fulfilled > 1 ? "s" : ""} enregistrée${
          fulfilled > 1 ? "s" : ""
        }`,
      )
      setPending(new Map())
      setEditMode(false)
    } else if (fulfilled === 0) {
      toast.error(`Échec de l'enregistrement (${rejected} erreur${rejected > 1 ? "s" : ""})`)
    } else {
      toast.warning(
        `${fulfilled} enregistrée${fulfilled > 1 ? "s" : ""}, ${rejected} erreur${
          rejected > 1 ? "s" : ""
        }`,
      )
    }

    await queryClient.invalidateQueries({
      queryKey: timetableKeys.availabilities(teacherId),
    })
    await queryClient.invalidateQueries({
      queryKey: ["teachers", teacherId, "full"],
    })

    setSaving(false)
  }, [pending, teacherId, queryClient])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-[450px] rounded-lg" />
      </div>
    )
  }

  const totalAvailable = Array.from(savedMap.values()).filter(
    (v) => v.state !== "unavailable",
  ).length
  const totalPreferred = Array.from(savedMap.values()).filter(
    (v) => v.state === "preferred",
  ).length
  const maxSlots = DAYS.length * HOURS.length

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-muted-foreground">
          Disponibilités <span className="font-medium text-foreground">annuelles</span> : ce planning
          récurrent (par jour de la semaine) sert de base à la génération de l&apos;emploi du temps, il
          ne se règle pas semaine par semaine. Pour une absence ponctuelle, utilisez plutôt une{" "}
          <span className="font-medium text-foreground">demande de congé</span>.
        </p>
      </div>

      <AvailabilityToolbar
        editMode={editMode}
        saving={saving}
        totalAvailable={totalAvailable}
        totalPreferred={totalPreferred}
        maxSlots={maxSlots}
        pendingCount={pending.size}
        onEnterEdit={() => setEditMode(true)}
        onCancel={handleCancel}
        onSave={handleSave}
      />

      <AvailabilityGrid
        getDisplayState={getDisplayState}
        isPendingCell={isPendingCell}
        interactive={editMode && !saving}
        onToggle={handleToggle}
      />

      <AvailabilityLegend pendingCount={pending.size} />
    </div>
  )
}
