"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  BookOpen,
  Camera,
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
import { Button } from "@/components/ui/button"
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
import { ContactActions } from "@/components/shared/ContactActions"
import type { HeroKpi } from "@/components/shared/PageHero"
import { TeacherEditModal } from "./TeacherEditModal"
import { TeacherOverviewTab } from "./tabs/TeacherOverviewTab"
import { TeacherProfileTab } from "./tabs/TeacherProfileTab"
import { TeacherClassesTab } from "./tabs/TeacherClassesTab"
import { TeacherEvaluationsTab } from "./tabs/TeacherEvaluationsTab"
import { TeacherTimetableTab } from "./tabs/TeacherTimetableTab"
import { TeacherAvailabilityTab } from "./tabs/TeacherAvailabilityTab"
import { TeacherAttendanceTab } from "./tabs/TeacherAttendanceTab"
import { useTeacher, useTeacherFull, useDeleteTeacher, teacherKeys } from "@/lib/hooks/useTeachers"
import { teachersApi } from "@/lib/api/teachers"
import { getUploadUrl } from "@/lib/utils"

interface TeacherDetailClientProps {
  teacherId: number
}

export function TeacherDetailClient({ teacherId }: TeacherDetailClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [photoLoaded, setPhotoLoaded] = useState(false)

  const { data: teacher, isLoading, isError, refetch } = useTeacher(teacherId)
  const { data: fullData } = useTeacherFull(teacherId)
  const { mutate: deleteTeacher, isPending: deleting } = useDeleteTeacher()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await teachersApi.uploadPhoto(teacherId, file)
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(teacherId) })
      toast.success("Photo mise à jour")
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeletePhoto = async () => {
    try {
      await teachersApi.deletePhoto(teacherId)
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
      setPhotoPreview(false)
      toast.success("Photo supprimée")
    } catch {
      toast.error("Erreur lors de la suppression de la photo")
    }
  }

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
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Camera className="mr-2 h-4 w-4" />
                {photoSrc ? "Changer la photo" : "Ajouter une photo"}
              </DropdownMenuItem>
              {photoSrc && photoLoaded && (
                <DropdownMenuItem onClick={handleDeletePhoto}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer la photo
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Photo preview dialog */}
      {photoSrc && (
        <Dialog open={photoPreview} onOpenChange={setPhotoPreview}>
          <DialogContent className="max-w-md p-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <img
                src={photoSrc}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-sm font-medium">{fullName}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhotoPreview(false)
                    fileInputRef.current?.click()
                  }}
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  Changer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeletePhoto}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Tabs — controlled + scroll-x mobile (pattern principe 13/14) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <TabsList className="w-max">
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

      {/* Edit modal */}
      <TeacherEditModal teacherId={teacherId} open={editOpen} onClose={() => setEditOpen(false)} />

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
