"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  Camera,
  Pencil,
  Trash2,
  User,
  Users,
  GraduationCap,
  Wallet,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { StudentEditModal } from "./StudentEditModal"
import { ProfileTab } from "./tabs/ProfileTab"
import { PaymentsTab } from "./tabs/PaymentsTab"
import { EnrollmentTab } from "./tabs/EnrollmentTab"
import { AttendanceTab } from "./tabs/AttendanceTab"
import { ParentsTab } from "./tabs/ParentsTab"
import { DocumentsTab } from "./tabs/DocumentsTab"
import { useStudent, useDeleteStudent, studentKeys } from "@/lib/hooks/useStudents"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { studentsApi } from "@/lib/api/students"
import { getUploadUrl } from "@/lib/utils"

// ---------- Main component ----------
interface StudentDetailClientProps {
  studentId: number
}

export function StudentDetailClient({ studentId }: StudentDetailClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { data: student, isLoading, isError, refetch } = useStudent(studentId)
  const { mutate: deleteStudent, isPending: deleting } = useDeleteStudent()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await studentsApi.uploadPhoto(studentId, file)
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) })
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
      await studentsApi.deletePhoto(studentId)
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) })
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
      setPhotoPreview(false)
      toast.success("Photo supprimée")
    } catch {
      toast.error("Erreur lors de la suppression de la photo")
    }
  }

  const handleDelete = () => {
    deleteStudent(studentId, {
      onSuccess: () => {
        router.push("/admin/students")
      },
    })
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <DataError message="Impossible de charger la fiche élève." onRetry={() => refetch()} />
  if (!student) return <DataError message="Élève introuvable." />

  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase()
  const fullName = `${student.last_name} ${student.first_name}`
  const photoSrc = getUploadUrl((student as Record<string, unknown>).photo_url as string | null | undefined)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/students"
            aria-label="Retour à la liste des élèves"
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
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {student.enrollment_number && (
                <span className="font-mono text-xs">{student.enrollment_number}</span>
              )}
              {student.genre && (
                <Badge variant="outline" className="text-[10px]">
                  {student.genre === "M" ? "Masculin" : "Féminin"}
                </Badge>
              )}
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
          <TabsTrigger value="inscription">
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            Inscriptions
          </TabsTrigger>
          <TabsTrigger value="paiements">
            <Wallet className="mr-1.5 h-3.5 w-3.5" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="presences">
            <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
            Présences
          </TabsTrigger>
          <TabsTrigger value="parents">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Parents
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab studentId={studentId} student={student} />
        </TabsContent>

        <TabsContent value="profil">
          <ProfileTab student={student} fullData={student as unknown as Record<string, unknown>} />
        </TabsContent>

        <TabsContent value="inscription">
          <EnrollmentTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="paiements">
          <PaymentsTab studentId={studentId} fullData={student as unknown as Record<string, unknown>} />
        </TabsContent>

        <TabsContent value="presences">
          <AttendanceTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="parents">
          <ParentsTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab studentId={studentId} />
        </TabsContent>
      </Tabs>

      {/* Edit modal */}
      <StudentEditModal studentId={studentId} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet élève ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;élève {fullName} sera définitivement supprimé.
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

// ---------- Overview tab ----------
function OverviewTab({ studentId, student }: { studentId: number; student: { first_name: string; last_name: string; genre?: string | null; enrollment_number?: string | null; birth_date?: string | null } }) {
  const { data: enrollmentsData, isLoading } = useEnrollments({ student_id: studentId })
  const enrollments = enrollmentsData?.items ?? []

  // Find the most recent enrollment (likely current year)
  const current = enrollments[0] as Record<string, unknown> | undefined

  if (isLoading) return <TabSkeleton />

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Classe</p>
                <p className="text-sm font-semibold">
                  {current?.class_name ? String(current.class_name) : "Non inscrit"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Année scolaire</p>
                <p className="text-sm font-semibold">
                  {current?.academic_year_name ? String(current.academic_year_name) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Statut</p>
                <p className="text-sm font-semibold">
                  {current?.status === "valide" ? "Validé" : current?.status === "en_validation" ? "En validation" : current?.status === "prospect" ? "Prospect" : current?.status ? String(current.status) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Matricule</p>
                <p className="text-sm font-semibold font-mono">
                  {student.enrollment_number ?? "Non attribué"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal info summary */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Informations personnelles</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Nom complet</p>
              <p className="text-sm font-medium">{student.last_name} {student.first_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Genre</p>
              <p className="text-sm font-medium">{student.genre === "M" ? "Masculin" : student.genre === "F" ? "Féminin" : "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date de naissance</p>
              <p className="text-sm font-medium">
                {student.birth_date ? new Date(student.birth_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Non renseigné"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Skeletons ----------
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
      <Skeleton className="h-10 w-80 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}

function TabSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-16 rounded-lg" />
    </div>
  )
}
