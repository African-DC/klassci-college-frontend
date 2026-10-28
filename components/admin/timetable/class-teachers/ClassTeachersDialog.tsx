"use client"

import { useState } from "react"
import { Users } from "lucide-react"
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

interface ClassTeachersDialogProps {
  classId: number
  className?: string
}

/** Bouton « Enseignants de la classe » qui ouvre le panneau dans une fenêtre. */
export function ClassTeachersDialog({ classId, className }: ClassTeachersDialogProps) {
  const [open, setOpen] = useState(false)
  const { data } = useClassSubjectTeachers(classId)
  const missing = data?.missing_count ?? 0

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className ?? "h-11 sm:h-10"}
        onClick={() => setOpen(true)}
      >
        <Users aria-hidden="true" className="mr-2 h-4 w-4" />
        Enseignants de la classe
        {missing > 0 && (
          <Badge className="ml-2 bg-amber-100 px-1.5 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200">
            {missing}
          </Badge>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enseignants de la classe</DialogTitle>
            <DialogDescription>
              Choisissez, matière par matière, l&apos;enseignant qui fera cours dans cette classe.
            </DialogDescription>
          </DialogHeader>
          <ClassSubjectTeachersPanel classId={classId} />
        </DialogContent>
      </Dialog>
    </>
  )
}
