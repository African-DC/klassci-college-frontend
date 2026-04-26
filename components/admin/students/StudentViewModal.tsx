"use client"

import { useStudent } from "@/lib/hooks/useStudents"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function ViewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  )
}

function ViewContent({ studentId }: { studentId: number }) {
  const { data: student, isLoading } = useStudent(studentId)

  if (isLoading || !student) return <ViewSkeleton />

  return (
    <div className="grid grid-cols-2 gap-5">
      <DetailField label="Nom" value={student.last_name ?? "—"} />
      <DetailField label="Prénom" value={student.first_name ?? "—"} />
      <DetailField label="Matricule" value={student.enrollment_number ?? "—"} />
      <DetailField
        label="Genre"
        value={student.genre === "M" ? "Masculin" : student.genre === "F" ? "Féminin" : "—"}
      />
      <DetailField label="Date de naissance" value={formatDate(student.birth_date)} />
      <DetailField label="Créé le" value={formatDate(student.created_at)} />
    </div>
  )
}

interface StudentViewModalProps {
  studentId: number | null
  open: boolean
  onClose: () => void
}

export function StudentViewModal({ studentId, open, onClose }: StudentViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Fiche élève</DialogTitle>
        </DialogHeader>
        {studentId && <ViewContent studentId={studentId} />}
      </DialogContent>
    </Dialog>
  )
}
