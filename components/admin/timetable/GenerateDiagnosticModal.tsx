"use client"

import { useState } from "react"
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClassSubjectTeachersPanel } from "@/components/admin/timetable/class-teachers/ClassSubjectTeachersPanel"
import { DiscardChangesDialog } from "@/components/admin/timetable/class-teachers/DiscardChangesDialog"
import { useDiscardGuard } from "@/components/admin/timetable/class-teachers/use-discard-guard"
import { TEACHERS_DIALOG_CONTENT } from "@/components/admin/timetable/class-teachers/class-teachers-styles"
import type { TimetableDiagnostic } from "@/lib/contracts/timetable"
import { DiagnosticView } from "./DiagnosticView"

interface GenerateDiagnosticModalProps {
  open: boolean
  diagnostic: TimetableDiagnostic | null
  onClose: () => void
  onGenerate: () => void
}

type ModalView = "diagnostic" | "teachers"

export function GenerateDiagnosticModal({
  open,
  diagnostic,
  onClose,
  onGenerate,
}: GenerateDiagnosticModalProps) {
  const [view, setView] = useState<ModalView>("diagnostic")
  const guard = useDiscardGuard()

  if (!diagnostic) return null

  const allAssigned = diagnostic.subjects_without_teacher.length === 0
  const inTeachersView = view === "teachers"

  function closeModal() {
    setView("diagnostic")
    onClose()
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) guard.guard(closeModal)
        }}
      >
        <DialogContent className={inTeachersView ? TEACHERS_DIALOG_CONTENT : "max-w-lg"}>
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
                onClick={() => guard.guard(() => setView("diagnostic"))}
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Retour au diagnostic
              </Button>
              <ClassSubjectTeachersPanel
                key={diagnostic.class_id}
                classId={diagnostic.class_id}
                onDirtyChange={guard.setDirty}
                onSaved={() => setView("diagnostic")}
              />
            </div>
          ) : (
            <>
              <DiagnosticView diagnostic={diagnostic} />
              <DialogFooter className="gap-2">
                <Button variant="outline" className="h-11 sm:h-10" onClick={closeModal}>
                  Annuler
                </Button>
                {!allAssigned && (
                  <Button className="h-11 sm:h-10" onClick={() => setView("teachers")}>
                    Compléter les enseignants
                  </Button>
                )}
                <Button className="h-11 sm:h-10" onClick={onGenerate} disabled={!allAssigned}>
                  Générer l&apos;emploi du temps
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <DiscardChangesDialog
        open={guard.discardOpen}
        onConfirm={guard.confirmDiscard}
        onCancel={guard.cancelDiscard}
      />
    </>
  )
}
