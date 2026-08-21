"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  BookOpen,
  Pencil,
  Trash2,
  User,
  GraduationCap,
  Users,
  FileText,
  CalendarDays,
  CalendarCheck,
  Clock,
  MoreVertical,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { DetailHero } from "@/components/shared/DetailHero"
import { AccountSection } from "@/components/shared/account/AccountSection"
import { ContactActions } from "@/components/shared/ContactActions"
import { ArchiveActionDialog, ARCHIVE_MENU_LABEL } from "@/components/shared/ArchiveActionDialog"
import { useArchiveAction } from "@/lib/hooks/useArchiveAction"
import type { HeroKpi } from "@/components/shared/PageHero"
import { TeacherEditModal } from "./TeacherEditModal"
import { TeacherOverviewTab } from "./tabs/TeacherOverviewTab"
import { TeacherProfileTab } from "./tabs/TeacherProfileTab"
import { TeacherClassesTab } from "./tabs/TeacherClassesTab"
import { TeacherEvaluationsTab } from "./tabs/TeacherEvaluationsTab"
import { TeacherTimetableTab } from "./tabs/TeacherTimetableTab"
import { TeacherAvailabilityTab } from "./tabs/TeacherAvailabilityTab"
import { TeacherAttendanceTab } from "./tabs/TeacherAttendanceTab"
import { useTeacher, useTeacherFull, useDeleteTeacher } from "@/lib/hooks/useTeachers"
import { getUploadUrl } from "@/lib/utils"

interface TeacherDetailClientProps {
  teacherId: number
}

export function TeacherDetailClient({ teacherId }: TeacherDetailClientProps) {
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [photoLoaded, setPhotoLoaded] = useState(false)

  const { data: teacher, isLoading, isError, refetch } = useTeacher(teacherId)
  const { data: fullData } = useTeacherFull(teacherId)
  const { mutate: deleteTeacher, isPending: deleting } = useDeleteTeacher()
  const archiveAction = useArchiveAction({
    entity: "teacher",
    id: teacherId,
    listRoute: "/admin/teachers",
  })

  const handleDelete = () => {
    deleteTeacher(teacherId, {
      onSuccess: () => {
        router.push("/admin/teachers")
      },
    })
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <DataError message="Impossible de charger la fiche enseignant." onRetry={() => refetch()} />
  if (!teacher) return <DataError message="Enseignant introuvable." />

  const initials = `${teacher.first_name?.[0] ?? ""}${teacher.last_name?.[0] ?? ""}`.toUpperCase()
  const fullName = `${teacher.last_name} ${teacher.first_name}`
  const photoSrc = getUploadUrl((teacher as Record<string, unknown>).photo_url as string | null | undefined)
  const userEmail = fullData?.user_email as string | null | undefined
  const heroKpis: HeroKpi[] = [
    { label: "Classes", value: (fullData?.classes_count as number | undefined) ?? 0, icon: GraduationCap },
    { label: "Élèves", value: (fullData?.students_count as number | undefined) ?? 0, icon: Users },
    { label: "Heures / sem", value: (fullData?.hours_per_week as number | undefined) ?? 0, icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <DetailHero
        onBack={() => router.push("/admin/teachers")}
        backLabel="Retour à la liste des enseignants"
        photoUrl={photoSrc}
        initials={initials}
        name={fullName}
        subtitle={teacher.speciality ?? "Enseignant"}
        contact={<ContactActions phone={teacher.phone} email={userEmail} variant="hero" />}
        kpis={heroKpis}
        onAvatarClick={() => photoLoaded && setPhotoPreview(true)}
        onPhotoStatus={setPhotoLoaded}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions sur l&apos;enseignant</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier les infos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Archiver d'abord : c'est le geste réversible, donc celui que
                  l'on veut voir avant la suppression définitive. */}
              {archiveAction.canArchive && (
                <DropdownMenuItem onClick={archiveAction.open}>
                  <Archive className="mr-2 h-4 w-4" />
                  {ARCHIVE_MENU_LABEL.teacher}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer l&apos;enseignant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Photo preview (lecture seule — gérée par l'enseignant sur son profil) */}
      {photoSrc && (
        <Dialog open={photoPreview} onOpenChange={setPhotoPreview}>
          <DialogContent className="max-w-md p-2 sm:p-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSrc} alt={fullName} className="h-full w-full object-cover" />
            </div>
            <p className="px-2 pb-1 text-sm font-medium">{fullName}</p>
          </DialogContent>
        </Dialog>
      )}

      {/* Tabs — controlled + scroll-x mobile (pattern principe 13/14) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <TabsList className="w-max max-w-none">
          <TabsTrigger value="overview">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="profil">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="classes">
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="evaluations">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Évaluations
          </TabsTrigger>
          <TabsTrigger value="emploi-du-temps">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            Emploi du temps
          </TabsTrigger>
          <TabsTrigger value="disponibilites">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Disponibilités
          </TabsTrigger>
          <TabsTrigger value="presences">
            <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
            Présences
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="overview">
          <TeacherOverviewTab
            teacherId={teacherId}
            teacher={teacher}
            fullData={fullData}
            onTabChange={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="profil">
          <TeacherProfileTab teacher={teacher} fullData={fullData} />
        </TabsContent>

        <TabsContent value="classes">
          <TeacherClassesTab teacherId={teacherId} fullData={fullData} />
        </TabsContent>

        <TabsContent value="evaluations">
          <TeacherEvaluationsTab teacherId={teacherId} />
        </TabsContent>

        <TabsContent value="emploi-du-temps">
          <TeacherTimetableTab teacherId={teacherId} />
        </TabsContent>

        <TabsContent value="disponibilites">
          <TeacherAvailabilityTab teacherId={teacherId} />
        </TabsContent>

        <TabsContent value="presences">
          <TeacherAttendanceTab teacherId={teacherId} />
        </TabsContent>
      </Tabs>

      {/* Compte de connexion — information secondaire, placée en bas de fiche */}
      <AccountSection entityType="teacher" entityId={teacherId} />

      {/* Edit modal */}
      <TeacherEditModal teacherId={teacherId} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Archivage — hors du menu déroulant, qui se démonte à la fermeture */}
      <ArchiveActionDialog action={archiveAction} entity="teacher" subject={fullName} />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet enseignant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;enseignant {fullName} sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        <Skeleton className="h-28 w-28 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-80 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
