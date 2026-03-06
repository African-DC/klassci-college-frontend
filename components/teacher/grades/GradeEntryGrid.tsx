"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Save, Loader2, CheckCircle2 } from "lucide-react"
import { useGrades, useUpdateGrades } from "@/lib/hooks/useGrades"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface GradeEntryGridProps {
  evaluationId: number
}

export function GradeEntryGrid({ evaluationId }: GradeEntryGridProps) {
  const { data: grades, isLoading, error } = useGrades(evaluationId)
  const { mutate: saveGrades, isPending } = useUpdateGrades(evaluationId)
  const [localGrades, setLocalGrades] = useState<Map<number, number | null>>(new Map())
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dirtyRef = useRef(false)

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
    saveGrades(
      { grades: payload },
      { onSuccess: () => { setLastSaved(new Date()); dirtyRef.current = false } }
    )
  }, [grades, localGrades, saveGrades])

  // Auto-save every 30s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => doSave(), 30000)
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current) }
  }, [doSave])

  function handleGradeChange(studentId: number, value: string) {
    const num = value === "" ? null : Math.min(20, Math.max(0, parseFloat(value)))
    setLocalGrades((prev) => new Map(prev).set(studentId, num))
    dirtyRef.current = true
  }

  function handleSave() {
    doSave()
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
        <Button onClick={handleSave} disabled={isPending} className="h-10">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isPending ? "Sauvegarde..." : "Enregistrer toutes les notes"}
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
        {grades.map((grade, index) => (
          <div
            key={grade.student_id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-muted-foreground font-mono w-6 shrink-0">
                {index + 1}.
              </span>
              <span className="text-sm font-medium truncate">
                {grade.student_name}
              </span>
            </div>
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={localGrades.get(grade.student_id) ?? ""}
              onChange={(e) => handleGradeChange(grade.student_id, e.target.value)}
              placeholder="--"
              className="h-11 w-20 shrink-0 rounded-lg border border-input bg-transparent px-3 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground/40"
              tabIndex={index + 1}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
