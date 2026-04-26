"use client"

import { useStaffMember } from "@/lib/hooks/useStaff"
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

function ViewContent({ staffId }: { staffId: number }) {
  const { data: staff, isLoading } = useStaffMember(staffId)

  if (isLoading || !staff) return <ViewSkeleton />

  return (
    <div className="grid grid-cols-2 gap-5">
      <DetailField label="Nom" value={staff.last_name ?? "—"} />
      <DetailField label="Prénom" value={staff.first_name ?? "—"} />
      <DetailField label="Poste" value={staff.position ?? "—"} />
      <DetailField label="Téléphone" value={staff.phone ?? "—"} />
      <DetailField label="Créé le" value={formatDate(staff.created_at)} />
    </div>
  )
}

interface StaffViewModalProps {
  staffId: number | null
  open: boolean
  onClose: () => void
}

export function StaffViewModal({ staffId, open, onClose }: StaffViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Fiche personnel</DialogTitle>
        </DialogHeader>
        {staffId && <ViewContent staffId={staffId} />}
      </DialogContent>
    </Dialog>
  )
}
