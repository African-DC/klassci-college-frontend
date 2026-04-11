"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  CalendarDays,
  Phone,
  BookOpen,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { TeacherEditModal } from "./TeacherEditModal"
import { useTeacher, useDeleteTeacher } from "@/lib/hooks/useTeachers"

interface TeacherDetailClientProps {
  teacherId: number
}

export function TeacherDetailClient({ teacherId }: TeacherDetailClientProps) {
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: teacher, isLoading, isError, refetch } = useTeacher(teacherId)
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

  const fields = [
    { label: "Nom", value: teacher.last_name, icon: User },
    { label: "Pr\u00e9nom", value: teacher.first_name, icon: User },
    { label: "Sp\u00e9cialit\u00e9", value: teacher.speciality, icon: BookOpen },
    { label: "T\u00e9l\u00e9phone", value: teacher.phone, icon: Phone },
    { label: "Cr\u00e9\u00e9 le", value: teacher.created_at ? new Date(teacher.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null, icon: CalendarDays },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/teachers"
            aria-label="Retour \u00e0 la liste des enseignants"
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
            {teacher.speciality && (
              <p className="mt-1 text-sm text-muted-foreground">{teacher.speciality}</p>
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

      {/* Info card */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
                <p className="text-sm font-medium">{f.value ?? "Non renseign\u00e9"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit modal */}
      <TeacherEditModal teacherId={teacherId} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet enseignant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irr\u00e9versible. L&apos;enseignant {fullName} sera d\u00e9finitivement supprim\u00e9.
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
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
