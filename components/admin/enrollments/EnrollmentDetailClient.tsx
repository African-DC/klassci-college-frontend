"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  BookOpen,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { EnrollmentOverviewTab } from "./tabs/EnrollmentOverviewTab"
import { EnrollmentPaymentsTab } from "./tabs/EnrollmentPaymentsTab"
import { useEnrollment, useDeleteEnrollment } from "@/lib/hooks/useEnrollments"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prospect: { label: "Prospect", variant: "outline" },
  en_validation: { label: "En validation", variant: "secondary" },
  valide: { label: "Valid\u00e9", variant: "default" },
  rejete: { label: "Rejet\u00e9", variant: "destructive" },
  annule: { label: "Annul\u00e9", variant: "destructive" },
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

  const studentName = [enrollment.student_first_name, enrollment.student_last_name]
    .filter(Boolean)
    .join(" ") || `\u00c9l\u00e8ve #${enrollment.student_id}`
  const className = enrollment.class_name ?? `Classe #${enrollment.class_id}`
  const academicYear = enrollment.academic_year_name ?? ""
  const subtitle = [className, academicYear].filter(Boolean).join(" \u2014 ")
  const status = statusConfig[enrollment.status] ?? { label: enrollment.status, variant: "outline" as const }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/enrollments"
            aria-label="Retour \u00e0 la liste des inscriptions"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <h1 className="font-serif text-2xl tracking-tight">{studentName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{subtitle}</span>
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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="paiements">
            <Wallet className="mr-1.5 h-3.5 w-3.5" />
            Paiements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EnrollmentOverviewTab enrollment={enrollment} />
        </TabsContent>

        <TabsContent value="paiements">
          <EnrollmentPaymentsTab enrollmentId={enrollmentId} />
        </TabsContent>
      </Tabs>

      {/* Edit modal */}
      <EnrollmentEditModal enrollmentId={enrollmentId} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette inscription ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irr&eacute;versible. L&apos;inscription de {studentName} sera d&eacute;finitivement supprim&eacute;e.
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

// ---------- Skeleton ----------
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-10 w-64 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
