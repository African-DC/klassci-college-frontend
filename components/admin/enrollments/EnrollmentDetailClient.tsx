"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  GraduationCap,
  BookOpen,
  CalendarDays,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataError } from "@/components/shared/DataError"
import { EnrollmentEditModal } from "./EnrollmentEditModal"
import { useEnrollment, useDeleteEnrollment } from "@/lib/hooks/useEnrollments"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prospect: { label: "Prospect", variant: "outline" },
  en_validation: { label: "En validation", variant: "secondary" },
  valide: { label: "Validé", variant: "default" },
  rejete: { label: "Rejeté", variant: "destructive" },
  annule: { label: "Annulé", variant: "destructive" },
}

interface EnrollmentDetailClientProps {
  enrollmentId: number
}

export function EnrollmentDetailClient({ enrollmentId }: EnrollmentDetailClientProps) {
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: enrollment, isLoading, isError, refetch } = useEnrollment(enrollmentId)
  const { mutate: deleteEnrollment, isPending: deleting } = useDeleteEnrollment()

  const handleDelete = () => {
    deleteEnrollment(enrollmentId, {
      onSuccess: () => {
        router.push("/admin/enrollments")
      },
    })
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <DataError message="Impossible de charger l'inscription." onRetry={() => refetch()} />
  if (!enrollment) return <DataError message="Inscription introuvable." />

  const studentName = [enrollment.student_first_name, enrollment.student_last_name].filter(Boolean).join(" ") || `Élève #${enrollment.student_id}`
  const className = enrollment.class_name ?? `Classe #${enrollment.class_id}`
  const status = statusConfig[enrollment.status] ?? { label: enrollment.status, variant: "outline" as const }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/enrollments"
            aria-label="Retour à la liste des inscriptions"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <h1 className="font-serif text-2xl tracking-tight">{studentName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{className}</span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Modifier
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Detail card */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field icon={GraduationCap} label="Élève" value={studentName} />
            <Field icon={BookOpen} label="Classe" value={className} />
            <Field icon={CalendarDays} label="Année scolaire" value={enrollment.academic_year_name} />
            <Field
              icon={GraduationCap}
              label="Statut"
              value={<Badge variant={status.variant}>{status.label}</Badge>}
            />
            <Field icon={FileText} label="Notes" value={enrollment.notes} />
            <Field
              icon={CalendarDays}
              label="Créé le"
              value={
                enrollment.created_at
                  ? new Date(enrollment.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit modal */}
      <EnrollmentEditModal enrollmentId={enrollmentId} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette inscription ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;inscription de {studentName} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Field display ----------
function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode | string | null | undefined
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="text-sm font-medium">
        {value ?? "Non renseigné"}
      </div>
    </div>
  )
}

// ---------- Skeleton ----------
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
