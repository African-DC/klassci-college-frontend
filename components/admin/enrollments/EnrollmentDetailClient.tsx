"use client"

import { enrollmentStatusView } from "@/lib/enrollment/status"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Archive,
  ExternalLink,
  Pencil,
  Trash2,
  BookOpen,
  Wallet,
  MoreVertical,
  GraduationCap,
  CalendarDays,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { DetailHero } from "@/components/shared/DetailHero"
import { ArchiveActionDialog, ARCHIVE_MENU_LABEL } from "@/components/shared/ArchiveActionDialog"
import { useArchiveAction } from "@/lib/hooks/useArchiveAction"
import type { HeroKpi } from "@/components/shared/PageHero"
import { EnrollmentEditModal } from "./EnrollmentEditModal"
import { EnrollmentOverviewTab } from "./tabs/EnrollmentOverviewTab"
import { EnrollmentPaymentsTab } from "./tabs/EnrollmentPaymentsTab"
import { useEnrollment, useDeleteEnrollment } from "@/lib/hooks/useEnrollments"

interface EnrollmentDetailClientProps {
  enrollmentId: number
}

export function EnrollmentDetailClient({ enrollmentId }: EnrollmentDetailClientProps) {
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: enrollment, isLoading, isError, refetch } = useEnrollment(enrollmentId)
  const { mutate: deleteEnrollment, isPending: deleting } = useDeleteEnrollment()
  const archiveAction = useArchiveAction({
    entity: "enrollment",
    id: enrollmentId,
    listRoute: "/admin/enrollments",
  })

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
    .join(" ") || `Élève #${enrollment.student_id}`
  const className = enrollment.class_name ?? `Classe #${enrollment.class_id}`
  const academicYear = enrollment.academic_year_name ?? ""
  const statusLabel = enrollmentStatusView(enrollment.status).label

  const initials = `${enrollment.student_first_name?.[0] ?? ""}${enrollment.student_last_name?.[0] ?? ""}`.toUpperCase()

  const kpis: HeroKpi[] = [
    { label: "Classe", value: className, icon: GraduationCap },
    { label: "Année scolaire", value: academicYear || "—", icon: CalendarDays },
  ]

  return (
    <div className="space-y-6">
      <DetailHero
        onBack={() => router.push("/admin/enrollments")}
        backLabel="Retour à la liste des inscriptions"
        initials={initials}
        name={studentName}
        subtitle="Fiche inscription"
        badge={
          <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white">
            {statusLabel}
          </span>
        }
        kpis={kpis}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions sur l&apos;inscription</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href={`/admin/students/${enrollment.student_id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir la fiche élève
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier l&apos;inscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Archiver d'abord : c'est le geste réversible, donc celui que
                  l'on veut voir avant la suppression définitive. Le serveur
                  refuse par ailleurs d'archiver une inscription qui porte des
                  versements, et explique pourquoi. */}
              {archiveAction.canArchive && (
                <DropdownMenuItem onClick={archiveAction.open}>
                  <Archive className="mr-2 h-4 w-4" />
                  {ARCHIVE_MENU_LABEL.enrollment}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer l&apos;inscription
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

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
          <EnrollmentPaymentsTab enrollmentId={enrollmentId} enrollment={enrollment as { student_id?: number }} />
        </TabsContent>
      </Tabs>

      {/* Edit modal */}
      <EnrollmentEditModal enrollmentId={enrollmentId} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Archivage — hors du menu déroulant, qui se démonte à la fermeture */}
      <ArchiveActionDialog
        action={archiveAction}
        entity="enrollment"
        subject={[studentName, className, academicYear].filter(Boolean).join(" · ")}
      />

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

// ---------- Skeleton ----------
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-20 w-20 rounded-full" />
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
