"use client"

import { useCallback, useMemo, useState } from "react"
import { Clock, Eye, Loader2, Pencil, Save, X } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { timetableApi } from "@/lib/api/timetable"
import {
  timetableKeys,
  useTeacherAvailabilities,
} from "@/lib/hooks/useTimetable"
import type { DayOfWeek, TeacherAvailability } from "@/lib/contracts/timetable"

interface TeacherAvailabilityTabProps {
  teacherId: number
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
]

// 07:00 to 18:00 (11 slots)
const HOURS = Array.from({ length: 11 }, (_, i) => {
  const h = 7 + i
  return {
    start: `${String(h).padStart(2, "0")}:00`,
    end: `${String(h + 1).padStart(2, "0")}:00`,
    label: `${String(h).padStart(2, "0")}h`,
  }
})

type CellState = "unavailable" | "available" | "preferred"

// L'utilisateur clique pour cycler : unavailable → available → preferred →
// unavailable (delete). En mode édition seulement.
const NEXT_STATE: Record<CellState, CellState> = {
  unavailable: "available",
  available: "preferred",
  preferred: "unavailable",
}

const STATE_STYLES: Record<CellState, string> = {
  unavailable:
    "bg-rose-500/15 text-rose-600 ring-1 ring-rose-300/40",
  available:
    "bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/30",
  preferred:
    "bg-primary/15 text-primary ring-1 ring-primary/30",
}

const STATE_LABELS: Record<CellState, string> = {
  unavailable: "",
  available: "Dispo",
  preferred: "Préféré",
}

interface SavedCell {
  id: number
  state: CellState
}

type PendingChange =
  | {
      kind: "create"
      target: Exclude<CellState, "unavailable">
    }
  | {
      kind: "update"
      existingId: number
      target: Exclude<CellState, "unavailable">
    }
  | {
      kind: "delete"
      existingId: number
      target: "unavailable"
    }

function cellKey(day: DayOfWeek, start: string, end: string) {
  return `${day}|${start}|${end}`
}

function buildSavedMap(
  availabilities: TeacherAvailability[],
): Map<string, SavedCell> {
  const m = new Map<string, SavedCell>()
  for (const av of availabilities) {
    const state: CellState = av.preferred
      ? "preferred"
      : av.available
        ? "available"
        : "unavailable"
    m.set(cellKey(av.day, av.start_time, av.end_time), { id: av.id, state })
  }
  return m
}

export function TeacherAvailabilityTab({
  teacherId,
}: TeacherAvailabilityTabProps) {
  const queryClient = useQueryClient()
  const { data: availabilities, isLoading } =
    useTeacherAvailabilities(teacherId)

  const [editMode, setEditMode] = useState(false)
  const [pending, setPending] = useState<Map<string, PendingChange>>(new Map())
  const [saving, setSaving] = useState(false)

  const savedMap = useMemo(
    () => buildSavedMap(availabilities ?? []),
    [availabilities],
  )

  // L'état affiché d'une cellule = pending si présent, sinon saved.
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
    (day: DayOfWeek, start: string, end: string) => pending.has(cellKey(day, start, end)),
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
        // Si le next = saved → on retire le pending (changement annulé)
        if (saved && next === saved.state) {
          m.delete(key)
          return m
        }
        // Si pas de saved ET next = unavailable → no-op (rien à créer)
        if (!saved && next === "unavailable") {
          m.delete(key)
          return m
        }
        // Construction d'un PendingChange explicitement typé selon le kind
        let change: PendingChange
        if (!saved) {
          // next ∈ {available, preferred} ici car saved est null et next ≠ unavailable
          change = { kind: "create", target: next as Exclude<CellState, "unavailable"> }
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

    // Toast cumulé (partial-success-with-reporting, cf. pattern bulk admin)
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
      // Garde le mode édit avec les pending échoués — l'utilisateur peut retry
      // ou annuler. Pour simplicité, on clear quand même (la re-fetch montrera l'état réel).
    }

    // Invalidation ciblée (pas reload de la page), refetch /availabilities seul
    await queryClient.invalidateQueries({
      queryKey: timetableKeys.availabilities(teacherId),
    })
    // Invalide aussi /full pour rafraîchir l'Overview KPI Disponibilité
    await queryClient.invalidateQueries({
      queryKey: ["teachers", teacherId, "full"],
    })

    setSaving(false)
  }, [pending, teacherId, queryClient])

  if (isLoading) {
    return <AvailabilitySkeleton />
  }

  const totalAvailable = Array.from(savedMap.values()).filter(
    (v) => v.state !== "unavailable",
  ).length
  const totalPreferred = Array.from(savedMap.values()).filter(
    (v) => v.state === "preferred",
  ).length
  const maxSlots = DAYS.length * HOURS.length
  const pendingCount = pending.size

  return (
    <div className="space-y-4">
      {/* Summary + controls (mode read vs edit) */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Disponibilités</span>
              {!editMode ? (
                <Badge
                  variant="outline"
                  className="ml-2 gap-1 border-muted-foreground/30 text-[10px] uppercase tracking-wide text-muted-foreground"
                >
                  <Eye className="h-3 w-3" />
                  Lecture
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="ml-2 gap-1 border-primary/40 bg-primary/5 text-[10px] uppercase tracking-wide text-primary"
                >
                  <Pencil className="h-3 w-3" />
                  Édition
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {totalAvailable}/{maxSlots} disponibles
              </Badge>
              {totalPreferred > 0 && (
                <Badge variant="outline" className="text-xs text-primary">
                  {totalPreferred} préférés
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs border-amber-400 text-amber-700 bg-amber-50"
                >
                  {pendingCount} en attente
                </Badge>
              )}
              {!editMode ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9"
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Modifier
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    className="h-9"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Enregistrer
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {editMode
              ? "Cliquez pour basculer : indisponible → disponible → préféré → indisponible. Les modifications sont mises en attente jusqu'à « Enregistrer »."
              : "Mode lecture. Cliquez sur « Modifier » pour saisir les disponibilités."}
          </p>
        </CardContent>
      </Card>

      {/* Grid */}
      <Card className="border-0 shadow-sm ring-1 ring-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-muted/50 p-2 text-left font-medium text-muted-foreground min-w-[60px]">
                    Heure
                  </th>
                  {DAYS.map((d) => (
                    <th
                      key={d.key}
                      className="p-2 text-center font-medium text-muted-foreground min-w-[80px]"
                    >
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour.start} className="border-t border-border/50">
                    <td className="sticky left-0 z-10 bg-muted/50 p-2 font-medium text-muted-foreground tabular-nums">
                      {hour.label}
                    </td>
                    {DAYS.map((day) => {
                      const state = getDisplayState(day.key, hour.start, hour.end)
                      const isPending = isPendingCell(day.key, hour.start, hour.end)
                      const interactive = editMode && !saving
                      return (
                        <td
                          key={cellKey(day.key, hour.start, hour.end)}
                          className="p-1"
                        >
                          <button
                            type="button"
                            disabled={!interactive}
                            onClick={() =>
                              handleToggle(day.key, hour.start, hour.end)
                            }
                            className={`
                              w-full h-9 rounded-md text-[10px] font-medium transition-colors
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                              ${interactive ? "hover:opacity-80 cursor-pointer" : "cursor-default"}
                              ${STATE_STYLES[state]}
                              ${isPending ? "ring-2 ring-dashed ring-amber-500/70" : ""}
                            `}
                            aria-label={`${day.label} ${hour.start}-${hour.end}: ${state}${isPending ? " (modification en attente)" : ""}`}
                          >
                            {STATE_LABELS[state]}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-emerald-500/20 ring-1 ring-emerald-500/30" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-primary/15 ring-1 ring-primary/30" />
          <span>Créneaux préférés</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-rose-500/15 ring-1 ring-rose-300/40" />
          <span>Indisponible</span>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 rounded-sm ring-2 ring-dashed ring-amber-500/70" />
            <span>Modification en attente</span>
          </div>
        )}
      </div>
    </div>
  )
}

function AvailabilitySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-[450px] rounded-lg" />
    </div>
  )
}
