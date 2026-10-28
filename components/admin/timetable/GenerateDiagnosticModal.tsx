"use client"

import { useState } from "react"
import { AlertTriangle, ArrowLeft, CheckCircle2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClassSubjectTeachersPanel } from "@/components/admin/timetable/class-teachers/ClassSubjectTeachersPanel"
import type { TimetableDiagnostic } from "@/lib/contracts/timetable"

interface GenerateDiagnosticModalProps {
  open: boolean
  diagnostic: TimetableDiagnostic | null
  onClose: () => void
  onGenerate: () => void
  /** Relit le diagnostic après l'enregistrement des enseignants. */
  onRefreshDiagnostic: () => Promise<void>
}

type ModalView = "diagnostic" | "teachers"

export function GenerateDiagnosticModal({
  open,
  diagnostic,
  onClose,
  onGenerate,
  onRefreshDiagnostic,
}: GenerateDiagnosticModalProps) {
  const [view, setView] = useState<ModalView>("diagnostic")

  if (!diagnostic) return null

  const missingCount = diagnostic.subjects_without_teacher.length
  const allAssigned = missingCount === 0
  const inTeachersView = view === "teachers"

  async function handleSaved() {
    await onRefreshDiagnostic()
    setView("diagnostic")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setView("diagnostic")
          onClose()
        }
      }}
    >
      <DialogContent
        className={inTeachersView ? "max-h-[90vh] max-w-3xl overflow-y-auto" : "max-w-lg"}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {allAssigned ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            )}
            {inTeachersView ? "Enseignants de la classe" : "Diagnostic de génération"}
          </DialogTitle>
        </DialogHeader>

        {inTeachersView ? (
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              className="h-11 px-2"
              onClick={() => setView("diagnostic")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Retour au diagnostic
            </Button>
            <ClassSubjectTeachersPanel classId={diagnostic.class_id} onSaved={handleSaved} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold">{diagnostic.total_hours_required}h</p>
                <p className="text-[11px] text-muted-foreground">Heures requises</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold">{diagnostic.manual_slots_count}</p>
                <p className="text-[11px] text-muted-foreground">Manuels (préservés)</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold">{diagnostic.subjects_with_teacher.length + missingCount}</p>
                <p className="text-[11px] text-muted-foreground">Matières</p>
              </div>
            </div>

            {diagnostic.subjects_with_teacher.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Matières prêtes
                </p>
                <div className="space-y-1.5">
                  {diagnostic.subjects_with_teacher.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                        <span className="truncate text-sm font-medium">{s.name}</span>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">{s.hours_per_week}h/sem</Badge>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{s.teacher_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {missingCount > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Matières sans enseignant ({missingCount})
                </p>
                <div className="space-y-1.5">
                  {diagnostic.subjects_without_teacher.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">{s.hours_per_week}h</Badge>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Choisissez l&apos;enseignant de chaque matière avant de générer l&apos;emploi du temps.
                </p>
              </div>
            )}
          </div>
        )}

        {!inTeachersView && (
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 sm:h-10" onClick={onClose}>
              Annuler
            </Button>
            {!allAssigned && (
              <Button className="h-11 sm:h-10" onClick={() => setView("teachers")}>
                Compléter les enseignants
              </Button>
            )}
            <Button
              className="h-11 sm:h-10"
              onClick={onGenerate}
              disabled={!allAssigned}
            >
              Générer l&apos;emploi du temps
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
