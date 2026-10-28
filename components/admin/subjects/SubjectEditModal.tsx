"use client"

import { useSubject } from "@/lib/hooks/useSubjects"
import { SubjectEditForm } from "./SubjectEditForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

function EditFormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

/** Charge la matière, puis monte le formulaire avec les données réelles. */
function SubjectEditBody({ subjectId, onClose }: { subjectId: number; onClose: () => void }) {
  const { data: subject, isLoading } = useSubject(subjectId)
  if (isLoading || !subject) return <EditFormSkeleton />
  return <SubjectEditForm key={subject.id} subject={subject} onClose={onClose} />
}

interface SubjectEditModalProps {
  subjectId: number | null
  open: boolean
  onClose: () => void
}

export function SubjectEditModal({ subjectId, open, onClose }: SubjectEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier la matière</DialogTitle>
        </DialogHeader>
        {subjectId && <SubjectEditBody subjectId={subjectId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
