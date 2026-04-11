"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  Camera,
  Pencil,
  Trash2,
  User,
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
import { DocumentsTab } from "./tabs/DocumentsTab"
import { useStudent, useDeleteStudent, studentKeys } from "@/lib/hooks/useStudents"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { studentsApi } from "@/lib/api/students"

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

          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="h-20 w-20 text-2xl">
              {(student as Record<string, unknown>).photo_url ? (
                <AvatarImage src={String((student as Record<string, unknown>).photo_url)} alt={fullName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Clock className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
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
