"use client"

import { useEnrollment } from "@/lib/hooks/useEnrollments"
import { enrollmentStatusView } from "@/lib/enrollment/status"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AssignmentStatusBadge } from "@/components/shared/AssignmentStatusBadge"


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

function ViewContent({ enrollmentId }: { enrollmentId: number }) {
  const { data: enrollment, isLoading } = useEnrollment(enrollmentId)

  if (isLoading || !enrollment) return <ViewSkeleton />

  const studentName = [enrollment.student_first_name, enrollment.student_last_name]
    .filter(Boolean)
    .join(" ") || "—"

  const status = enrollmentStatusView(enrollment.status)

  return (
    <div className="grid grid-cols-2 gap-5">
      <DetailField label="Élève" value={studentName} />
      <DetailField label="Classe" value={enrollment.class_name ?? "—"} />
      <DetailField label="Année scolaire" value={enrollment.academic_year_name ?? "—"} />
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Statut</p>
        <div>
          <Badge variant={status?.variant ?? "outline"}>
            {status?.label ?? enrollment.status}
          </Badge>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Affectation</p>
        <div>
          <AssignmentStatusBadge status={enrollment.assignment_status} />
        </div>
      </div>
      {/* Le numéro n'existe que pour un affecté ou un réaffecté : afficher un
          tiret pour les autres laisserait croire à une saisie oubliée. */}
      {enrollment.assignment_decision_number ? (
        <DetailField
          label="Numéro de décision"
          value={enrollment.assignment_decision_number}
        />
      ) : null}
      <DetailField label="Notes" value={enrollment.notes ?? "—"} />
      <DetailField label="Créé le" value={formatDate(enrollment.created_at)} />
    </div>
  )
}

interface EnrollmentViewModalProps {
  enrollmentId: number | null
  open: boolean
  onClose: () => void
}

export function EnrollmentViewModal({ enrollmentId, open, onClose }: EnrollmentViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Fiche inscription</DialogTitle>
        </DialogHeader>
        {enrollmentId && <ViewContent enrollmentId={enrollmentId} />}
      </DialogContent>
    </Dialog>
  )
}
