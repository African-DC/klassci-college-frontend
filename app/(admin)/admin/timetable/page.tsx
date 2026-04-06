"use client"

import { useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Wand2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTimetableStore } from "@/lib/stores/useTimetableStore"
import { useGenerateTimetable } from "@/lib/hooks/useTimetable"
import { timetableApi } from "@/lib/api/timetable"
import { useQueryClient } from "@tanstack/react-query"
import { timetableKeys } from "@/lib/hooks/useTimetable"
import { TimetableGrid } from "@/components/admin/timetable/TimetableGrid"

export default function TimetablePage() {
  const { selectedClassId, setSelectedClassId, weekOffset, nextWeek, prevWeek, resetWeek } = useTimetableStore()
  const generateMutation = useGenerateTimetable()
  const queryClient = useQueryClient()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollFnRef = useRef<(() => Promise<void>) | null>(null)
  const pollCountRef = useRef(0)
  const MAX_POLL_ATTEMPTS = 100 // 100 × 3s = 5 minutes max

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  function handleGenerate() {
    if (!selectedClassId || pollingRef.current) return // guard double-click
    generateMutation.mutate(selectedClassId, {
      onSuccess: (data) => {
        toast.info("Generation lancee", { description: "Veuillez patienter..." })
        pollCountRef.current = 0

        // Store the poll function in a ref so the interval always calls the latest version
        pollFnRef.current = async () => {
          pollCountRef.current++
          if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            pollingRef.current = null
            toast.error("Timeout", { description: "La génération prend trop de temps. Réessayez plus tard." })
            return
          }
          try {
            const status = await timetableApi.taskStatus(data.task_id)
            if (status.status === "completed") {
              if (pollingRef.current) clearInterval(pollingRef.current)
              pollingRef.current = null
              queryClient.invalidateQueries({ queryKey: timetableKeys.all })
              toast.success("Generation terminee", { description: "L'emploi du temps a ete genere avec succes." })
            } else if (status.status === "failed") {
              if (pollingRef.current) clearInterval(pollingRef.current)
              pollingRef.current = null
              toast.error("Echec de la generation", { description: status.message ?? "Une erreur est survenue." })
            }
          } catch {
            if (pollingRef.current) clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }

        // Start polling with stable interval
        pollingRef.current = setInterval(() => {
          pollFnRef.current?.()
        }, 3000)
      },
      onError: (error) => {
        toast.error("Erreur", { description: error.message })
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emploi du temps</h1>
          <p className="text-muted-foreground">
            Gerez les creneaux horaires par classe
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={!selectedClassId || generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generer automatiquement
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Classe :
          </label>
          <Input
            type="number"
            placeholder="ID classe"
            className="h-9 w-32"
            value={selectedClassId ?? ""}
            onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetWeek} className="text-sm">
            {weekOffset === 0 ? "Cette semaine" : `Semaine ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      {selectedClassId ? (
        <TimetableGrid classId={selectedClassId} weekOffset={weekOffset} />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Selectionnez une classe pour afficher l&apos;emploi du temps
          </p>
        </div>
      )}
    </div>
  )
}
