"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Pencil,
  Trash2,
  User,
  GraduationCap,
  Phone,
  FileText,
  CalendarDays,
  Clock,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
import { TeacherEditModal } from "./TeacherEditModal"
import { TeacherOverviewTab } from "./tabs/TeacherOverviewTab"
import { TeacherProfileTab } from "./tabs/TeacherProfileTab"
import { TeacherClassesTab } from "./tabs/TeacherClassesTab"
import { TeacherEvaluationsTab } from "./tabs/TeacherEvaluationsTab"
import { TeacherTimetableTab } from "./tabs/TeacherTimetableTab"
import { TeacherAvailabilityTab } from "./tabs/TeacherAvailabilityTab"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/teachers"
            aria-label="Retour à la liste des enseignants"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Photo — clic = agrandir, bouton camera = upload */}
          <div className="relative shrink-0">
            <div
              className={`overflow-hidden rounded-2xl border-2 border-border ${photoSrc ? "cursor-pointer" : ""}`}
              onClick={() => photoSrc && setPhotoPreview(true)}
            >
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={fullName}
                  className="h-28 w-28 object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center bg-primary/10">
                  <span className="text-3xl font-semibold text-primary">{initials}</span>
                </div>
              )}
            </div>
            {/* Bouton camera en bas à droite */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              {uploading ? (
                <Clock className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="min-w-0">
            <h1 className="font-serif text-2xl tracking-tight">{fullName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {teacher.speciality ?? "Enseignant"}
            </p>
            {teacher.phone && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  <Phone className="mr-1 h-3 w-3" />
                  {teacher.phone}
                </Badge>
              </div>
            )}
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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
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
        </TabsList>

        <TabsContent value="overview">
          <TeacherOverviewTab teacherId={teacherId} teacher={teacher} fullData={fullData} />
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
