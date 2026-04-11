"use client"

import { useTeacher } from "@/lib/hooks/useTeachers"
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
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  )
}

function ViewContent({ teacherId }: { teacherId: number }) {
  const { data: teacher, isLoading } = useTeacher(teacherId)

  if (isLoading || !teacher) return <ViewSkeleton />

  return (
    <div className="grid grid-cols-2 gap-5">
      <DetailField label="Nom" value={teacher.last_name ?? "—"} />
      <DetailField label="Prénom" value={teacher.first_name ?? "—"} />
      <DetailField label="Spécialité" value={teacher.speciality ?? "—"} />
      <DetailField label="Téléphone" value={teacher.phone ?? "—"} />
      <DetailField label="Créé le" value={formatDate(teacher.created_at)} />
    </div>
  )
}

interface TeacherViewModalProps {
  teacherId: number | null
  open: boolean
  onClose: () => void
}

export function TeacherViewModal({ teacherId, open, onClose }: TeacherViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Fiche enseignant</DialogTitle>
        </DialogHeader>
        {teacherId && <ViewContent teacherId={teacherId} />}
      </DialogContent>
    </Dialog>
  )
}
