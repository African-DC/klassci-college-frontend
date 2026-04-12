"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
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
import { TeacherProfileTab } from "./tabs/TeacherProfileTab"
import { TeacherClassesTab } from "./tabs/TeacherClassesTab"
import { TeacherEvaluationsTab } from "./tabs/TeacherEvaluationsTab"
import { TeacherTimetableTab } from "./tabs/TeacherTimetableTab"
import { TeacherAvailabilityTab } from "./tabs/TeacherAvailabilityTab"
import { useTeacher, useTeacherFull, useDeleteTeacher } from "@/lib/hooks/useTeachers"

interface TeacherDetailClientProps {
  teacherId: number
}

export function TeacherDetailClient({ teacherId }: TeacherDetailClientProps) {
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: teacher, isLoading, isError, refetch } = useTeacher(teacherId)
  const { data: fullData } = useTeacherFull(teacherId)
  const { mutate: deleteTeacher, isPending: deleting } = useDeleteTeacher()

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

          <Avatar className="h-20 w-20 text-2xl">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

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

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList>
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
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
