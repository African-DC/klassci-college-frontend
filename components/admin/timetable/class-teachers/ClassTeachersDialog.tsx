"use client"

import { useState } from "react"
import { Users, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useClassSubjectTeachers } from "@/lib/hooks/useClassSubjectTeachers"
import { ClassSubjectTeachersPanel } from "./ClassSubjectTeachersPanel"
import { DiscardChangesDialog } from "./DiscardChangesDialog"
import { useDiscardGuard } from "./use-discard-guard"
import { TEACHERS_DIALOG_CONTENT } from "./class-teachers-styles"

interface ClassTeachersDialogProps {
  classId: number
  compact?: boolean
  onSaved?: () => void
}

/** Bouton « Enseignants de la classe » qui ouvre le panneau dans une fenêtre. */
export function ClassTeachersDialog({ classId, compact = false, onSaved }: ClassTeachersDialogProps) {
  const [open, setOpen] = useState(false)
  const guard = useDiscardGuard()
  const { data } = useClassSubjectTeachers(classId)
  const missing = data?.missing_count ?? 0

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-11 sm:h-10"
        onClick={() => setOpen(true)}
      >
        {compact ? <Pencil aria-hidden="true" className="mr-2 h-4 w-4" /> : <Users aria-hidden="true" className="mr-2 h-4 w-4" />}
        {compact ? "Modifier l’affectation" : "Enseignants de la classe"}
        {missing > 0 && (
          <Badge className="ml-2 bg-amber-100 px-1.5 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200">
            {missing}
          </Badge>
        )}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (v) setOpen(true)
          else guard.guard(() => setOpen(false))
        }}
      >
        <DialogContent className={TEACHERS_DIALOG_CONTENT}>
          <DialogHeader>
            <DialogTitle>Enseignants de la classe</DialogTitle>
            <DialogDescription>
              Choisissez, matière par matière, l&apos;enseignant qui fera cours dans cette classe.
            </DialogDescription>
          </DialogHeader>
          <ClassSubjectTeachersPanel
            key={classId}
            classId={classId}
            onDirtyChange={guard.setDirty}
            onSaved={() => {
              guard.setDirty(false)
              setOpen(false)
              onSaved?.()
            }}
          />
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
