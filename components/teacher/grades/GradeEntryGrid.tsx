"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useGrades, useUpdateGrades } from "@/lib/hooks/useGrades"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

type CellStatus = "idle" | "pending" | "saved" | "error"

interface GradeEntryGridProps {
  evaluationId: number
}

export function GradeEntryGrid({ evaluationId }: GradeEntryGridProps) {
  const { data: grades, isLoading, error } = useGrades(evaluationId)
  const updateMutation = useUpdateGrades(evaluationId)
  const [localGrades, setLocalGrades] = useState<Map<number, number | null>>(new Map())
  const [cellStatus, setCellStatus] = useState<Map<number, CellStatus>>(new Map())
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const dirtyRef = useRef(false)
  const doSaveRef = useRef<() => void>(() => {})

  // Sync from server
  useEffect(() => {
    if (grades) {
      const map = new Map<number, number | null>()
      grades.forEach((g) => map.set(g.student_id, g.value))
      setLocalGrades(map)
    }
  }, [grades])

  const doSave = useCallback(() => {
    if (!dirtyRef.current || !grades) return
    const payload = grades.map((g) => ({
      student_id: g.student_id,
      value: localGrades.get(g.student_id) ?? null,
    }))

    // Mark all dirty cells as pending
    const pendingStatus = new Map(cellStatus)
    for (const g of grades) {
      pendingStatus.set(g.student_id, "pending")
    }
    setCellStatus(pendingStatus)

    updateMutation.mutate(
      { grades: payload },
      {
        onSuccess: () => {
          setLastSaved(new Date())
          dirtyRef.current = false
          const savedStatus = new Map<number, CellStatus>()
          for (const g of grades) {
            savedStatus.set(g.student_id, "saved")
          }
          setCellStatus(savedStatus)
          toast.success("Notes sauvegardees")
          // Reset to idle after 3s
          setTimeout(() => setCellStatus(new Map()), 3000)
        },
        onError: () => {
          const errorStatus = new Map<number, CellStatus>()
          for (const g of grades) {
            errorStatus.set(g.student_id, "error")
          }
          setCellStatus(errorStatus)
        },
      },
    )
  }, [grades, localGrades, cellStatus, updateMutation])

  // Keep ref in sync for stable interval
  useEffect(() => {
    doSaveRef.current = doSave
  }, [doSave])

  // Auto-save every 30s with stable interval
  useEffect(() => {
    const id = setInterval(() => doSaveRef.current(), 30000)
    return () => clearInterval(id)
  }, [])

  function handleGradeChange(studentId: number, value: string) {
    const num = value === "" ? null : Math.min(20, Math.max(0, parseFloat(value)))
    setLocalGrades((prev) => new Map(prev).set(studentId, num))
    dirtyRef.current = true
    // Reset cell status on edit
    setCellStatus((prev) => {
      const next = new Map(prev)
      next.set(studentId, "idle")
      return next
    })
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  if (isLoading || !grades) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-11 w-20" />
          </div>
        ))}
      </div>
    )
  }

  const gradedCount = Array.from(localGrades.values()).filter((v) => v !== null).length
  const totalCount = grades.length

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={gradedCount === totalCount ? "default" : "secondary"} className="text-xs">
            {gradedCount}/{totalCount} eleves notes
          </Badge>
          {lastSaved && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Sauvegarde a {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <Button onClick={() => doSave()} disabled={updateMutation.isPending} className="h-10">
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {updateMutation.isPending ? "Sauvegarde..." : "Enregistrer toutes les notes"}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${totalCount > 0 ? (gradedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Grade entries */}
      <div className="rounded-lg border bg-card divide-y">
        {grades.map((grade, index) => {
          const status = cellStatus.get(grade.student_id) ?? "idle"
          return (
            <div
              key={grade.student_id}
              className={cn(
                "flex items-center justify-between gap-4 px-4 py-3 transition-colors",
                status === "saved" && "bg-emerald-50",
                status === "error" && "bg-destructive/5",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground font-mono w-6 shrink-0">
                  {index + 1}.
                </span>
                <span className="text-sm font-medium truncate">
                  {grade.student_name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={localGrades.get(grade.student_id) ?? ""}
                  onChange={(e) => handleGradeChange(grade.student_id, e.target.value)}
                  placeholder="--"
                  className={cn(
                    "h-11 w-20 rounded-lg border bg-transparent px-3 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground/40",
                    status === "saved" && "border-emerald-400",
                    status === "error" && "border-destructive",
                    status === "idle" && "border-input",
                  )}
                  tabIndex={index + 1}
                />
                {status === "pending" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {status === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
