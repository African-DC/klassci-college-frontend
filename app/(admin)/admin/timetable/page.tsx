"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Calendar, ChevronLeft, ChevronRight, FileDown, Wand2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTimetableStore } from "@/lib/stores/useTimetableStore"
import { useGenerateTimetable } from "@/lib/hooks/useTimetable"
import { useClasses } from "@/lib/hooks/useClasses"
import { timetableApi } from "@/lib/api/timetable"
import { downloadBlob } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { timetableKeys } from "@/lib/hooks/useTimetable"
import { TimetableGrid } from "@/components/admin/timetable/TimetableGrid"
import { TimetableHoursSidebar } from "@/components/admin/timetable/TimetableHoursSidebar"
import { GenerateDiagnosticModal } from "@/components/admin/timetable/GenerateDiagnosticModal"
import type { TimetableDiagnostic } from "@/lib/contracts/timetable"

export default function TimetablePage() {
  const { selectedClassId, setSelectedClassId, weekOffset, nextWeek, prevWeek, resetWeek } = useTimetableStore()
  const generateMutation = useGenerateTimetable()
  const queryClient = useQueryClient()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollFnRef = useRef<(() => Promise<void>) | null>(null)
  const pollCountRef = useRef(0)
  const MAX_POLL_ATTEMPTS = 100

  const [diagnosticOpen, setDiagnosticOpen] = useState(false)
  const [diagnostic, setDiagnostic] = useState<TimetableDiagnostic | null>(null)
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const { data: classesData } = useClasses({ size: 100 })
  const classes = useMemo(() => classesData?.items ?? [], [classesData])

  // Cleanup polling on unmount or class change
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Clear polling when class changes
  useEffect(() => {
    stopPolling()
  }, [selectedClassId])

  function stopPolling() {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = null
    setIsPolling(false)
  }

  function startPolling(taskId: string) {
    setIsPolling(true)
    pollCountRef.current = 0
    pollFnRef.current = async () => {
      pollCountRef.current++
      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling()
        toast.error("Timeout", { description: "La génération prend trop de temps." })
        return
      }
      try {
        const status = await timetableApi.taskStatus(taskId)
        if (status.status === "completed") {
          stopPolling()
          queryClient.invalidateQueries({ queryKey: timetableKeys.all })
          toast.success("Emploi du temps généré avec succès")
        } else if (status.status === "failed") {
          stopPolling()
          toast.error("Échec de la génération", { description: status.message ?? "Erreur inconnue" })
        }
      } catch {
        stopPolling()
      }
    }
    pollingRef.current = setInterval(() => { pollFnRef.current?.() }, 3000)
  }

  // Step 1: Run diagnostic before generating
  async function handleGenerateClick() {
    if (!selectedClassId || pollingRef.current) return
    setLoadingDiagnostic(true)
    try {
      const diag = await timetableApi.diagnostic(selectedClassId)
      setDiagnostic(diag)
      if (diag.ready) {
        // All subjects have teachers — generate directly
        launchGeneration()
      } else {
        // Missing teachers — show modal
        setDiagnosticOpen(true)
      }
    } catch (err) {
      toast.error("Erreur diagnostic", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setLoadingDiagnostic(false)
    }
  }

  // Step 2: Launch generation (after diagnostic passes or after inline assignment)
  const launchGeneration = useCallback(() => {
    if (!selectedClassId) return
    setDiagnosticOpen(false)
    generateMutation.mutate(selectedClassId, {
      onSuccess: (data) => {
        toast.info("Génération lancée", { description: "Les créneaux manuels sont préservés." })
        if (data.task_id) startPolling(data.task_id)
      },
      onError: (error) => toast.error("Erreur", { description: error.message }),
    })
  }, [selectedClassId, generateMutation, queryClient])

  const isGenerating = generateMutation.isPending || isPolling || loadingDiagnostic

  async function handleExportPdf() {
    if (!selectedClassId) return
    setExportingPdf(true)
    try {
      const blob = await timetableApi.exportPdf(selectedClassId, weekOffset)
      const className = classes.find((c) => c.id === selectedClassId)?.name ?? "classe"
      downloadBlob(blob, `emploi-du-temps-${className}.pdf`)
      toast.success("PDF exporté avec succès")
    } catch (err) {
      toast.error("Erreur export PDF", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      })
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Emploi du temps</h1>
            <p className="text-sm text-muted-foreground">Gérez les créneaux horaires par classe</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={!selectedClassId || exportingPdf}
          >
            {exportingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exporter PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateClick}
            disabled={!selectedClassId || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Générer automatiquement
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Classe :
          </label>
          <Select
            value={selectedClassId?.toString() ?? ""}
            onValueChange={(v) => setSelectedClassId(v ? Number(v) : null)}
          >
            <SelectTrigger className="h-10 w-56">
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name} {c.level_name ? `(${c.level_name})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetWeek} className="text-sm min-w-[120px]">
            {weekOffset === 0 ? "Cette semaine" : `Semaine ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Class tabs */}
      {classes.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {classes.slice(0, 15).map((c) => (
            <button
              key={c.id}
              type="button"
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedClassId === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
              onClick={() => setSelectedClassId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid + Sidebar */}
      {selectedClassId ? (
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <TimetableGrid classId={selectedClassId} weekOffset={weekOffset} />
          </div>
          <TimetableHoursSidebar classId={selectedClassId} weekOffset={weekOffset} />
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Sélectionnez une classe pour afficher l'emploi du temps
          </p>
        </div>
      )}

      {/* Diagnostic Modal */}
      <GenerateDiagnosticModal
        open={diagnosticOpen}
        diagnostic={diagnostic}
        onClose={() => setDiagnosticOpen(false)}
        onGenerate={launchGeneration}
      />
    </div>
  )
}
