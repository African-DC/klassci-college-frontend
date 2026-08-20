"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Archive,
  Camera,
  Pencil,
  Trash2,
  User,
  Users,
  GraduationCap,
  Wallet,
  ClipboardCheck,
  BookOpen,
  FileText,
  MoreVertical,
  Phone,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { ArchiveActionDialog, ARCHIVE_MENU_LABEL } from "@/components/shared/ArchiveActionDialog"
import { useArchiveAction } from "@/lib/hooks/useArchiveAction"
import { AccountSection } from "@/components/shared/account/AccountSection"
import type { HeroKpi } from "@/components/shared/PageHero"
import { PaymentStatusBadge } from "@/components/shared/finance/PaymentStatusBadge"
import { StudentEditModal } from "./StudentEditModal"
import { StudentJourneyTimeline } from "./StudentJourneyTimeline"
import { StudentAcademicCharts } from "./StudentAcademicCharts"
import { StatusPill } from "./tabs/_primitives"
import { ProfileTab } from "./tabs/ProfileTab"
import { PaymentsTab } from "./tabs/PaymentsTab"
import { EnrollmentTab } from "./tabs/EnrollmentTab"
import { AttendanceTab } from "./tabs/AttendanceTab"
import { ParentsTab } from "./tabs/ParentsTab"
import { DocumentsTab } from "./tabs/DocumentsTab"
import { useStudent, useDeleteStudent, studentKeys, useStudentFees, useStudentFull } from "@/lib/hooks/useStudents"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { useStudentParents } from "@/lib/hooks/useParents"
import { studentsApi } from "@/lib/api/students"
import { getUploadUrl } from "@/lib/utils"

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

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
  const [activeTab, setActiveTab] = useState("parcours")
  const [photoLoaded, setPhotoLoaded] = useState(false)

  const { data: student, isLoading, isError, refetch } = useStudent(studentId)
  const { data: full } = useStudentFull(studentId)
  const { mutate: deleteStudent, isPending: deleting } = useDeleteStudent()
  const archiveAction = useArchiveAction({
    entity: "student",
    id: studentId,
    listRoute: "/admin/students",
  })

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
  const f = full as Record<string, unknown> | undefined
  const heroKpis: HeroKpi[] = [
    { label: "Classe", value: (f?.current_class_name as string | undefined) ?? "—", icon: GraduationCap },
    { label: "Présence", value: `${(f?.attendance_rate as number | undefined) ?? 0}%`, icon: ClipboardCheck },
  ]
  const feesRemainingRaw = f?.fees_remaining as number | null | undefined
  // `null` signifie « vous n'avez pas le droit de lire ce montant » ; `undefined`
  // signifie « pas encore charge ». Le premier merite le badge, pas le second.
  const amountsHidden = f !== undefined && feesRemainingRaw === null
  if (amountsHidden) {
    heroKpis.push({
      label: "Paiement",
      value: (
        <PaymentStatusBadge
          status={f?.fee_status as string | null | undefined}
          lastPaymentDate={f?.last_payment_date as string | null | undefined}
          onHero
        />
      ),
      icon: Wallet,
    })
  } else {
    heroKpis.push({
      label: "Reste à payer",
      value: formatFCFA(feesRemainingRaw ?? 0),
      icon: Wallet,
      hint: (f?.current_academic_year as string | undefined)
        ? `Année ${f?.current_academic_year as string}`
        : undefined,
    })
  }
  const genreLabel = student.genre === "M" ? "Masculin" : student.genre === "F" ? "Féminin" : null

  return (
    <div className="space-y-6">
      <DetailHero
        onBack={() => router.push("/admin/students")}
        backLabel="Retour à la liste des élèves"
        photoUrl={photoSrc}
        initials={initials}
        name={fullName}
        subtitle={
          [student.enrollment_number, genreLabel, f?.current_class_name as string | undefined]
            .filter(Boolean)
            .join(" · ") || "Élève"
        }
        kpis={heroKpis}
        onAvatarClick={() => photoLoaded && setPhotoPreview(true)}
        onPhotoStatus={setPhotoLoaded}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions sur l&apos;élève</span>
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
              {/* Archiver est le geste courant, il précède donc la suppression
                  définitive, qu'on ne veut pas rencontrer en premier. */}
              {archiveAction.canArchive && (
                <DropdownMenuItem onClick={archiveAction.open}>
                  <Archive className="mr-2 h-4 w-4" />
                  {ARCHIVE_MENU_LABEL.student}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer l&apos;élève
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

      {/* Tabs — reordered by usage frequency, scroll-x on mobile, controlled for cross-tab links */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <TabsList className="w-max">
            <TabsTrigger value="parcours">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Parcours
            </TabsTrigger>
            <TabsTrigger value="overview">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Vue d&apos;ensemble
            </TabsTrigger>
            {amountsHidden ? null : (
              <TabsTrigger value="paiements">
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                Paiements
              </TabsTrigger>
            )}
            <TabsTrigger value="parents">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Parents
            </TabsTrigger>
            <TabsTrigger value="inscription">
              <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
              Inscriptions
            </TabsTrigger>
            <TabsTrigger value="profil">
              <User className="mr-1.5 h-3.5 w-3.5" />
              Profil
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
        </div>

        <TabsContent value="parcours" className="space-y-4">
          <StudentJourneyTimeline studentId={studentId} studentName={fullName} />
          <StudentAcademicCharts studentId={studentId} />
        </TabsContent>

        <TabsContent value="overview">
          <OverviewTab studentId={studentId} student={student} onTabChange={setActiveTab} />
        </TabsContent>

        {amountsHidden ? null : (
          <TabsContent value="paiements">
            <PaymentsTab studentId={studentId} fullData={full ?? undefined} />
          </TabsContent>
        )}

        <TabsContent value="parents">
          <ParentsTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="inscription">
          <EnrollmentTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="profil">
          <ProfileTab student={student} fullData={full ?? undefined} />
        </TabsContent>

        <TabsContent value="presences">
          <AttendanceTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab studentId={studentId} studentLastName={student.last_name} />
        </TabsContent>
      </Tabs>

      {/* Compte de connexion — information secondaire, placée en bas de fiche */}
      <AccountSection entityType="student" entityId={studentId} />

      {/* Edit modal */}
      <StudentEditModal studentId={studentId} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Archivage — hors du menu déroulant, qui se démonte à la fermeture */}
      <ArchiveActionDialog
        action={archiveAction}
        entity="student"
        subject={
          student.enrollment_number ? `${fullName} · ${student.enrollment_number}` : fullName
        }
      />

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

// ---------- Overview tab — actionable, persona-first ----------
function OverviewTab({
  studentId,
  student,
  onTabChange,
}: {
  studentId: number
  student: {
    first_name: string
    last_name: string
    genre?: string | null
    enrollment_number?: string | null
    birth_date?: string | null
  }
  onTabChange?: (tab: string) => void
}) {
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrollments({
    student_id: studentId,
  })
  const { data: fees, isLoading: feesLoading } = useStudentFees(studentId)
  const {
    data: parents,
    isLoading: parentsLoading,
    isError: parentsError,
    refetch: refetchParents,
  } = useStudentParents(studentId)

  const enrollments = enrollmentsData?.items ?? []
  const current = enrollments[0] as Record<string, unknown> | undefined

  const totalExpected = (fees ?? []).reduce((sum, f) => sum + f.amount, 0)
  const totalPaid = (fees ?? []).reduce((sum, f) => sum + f.paid, 0)
  const feesRemaining = Math.max(0, totalExpected - totalPaid)
  const feesRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0

  if (enrollmentsLoading) return <TabSkeleton />

  const enrolledOn = current?.created_at
    ? new Date(String(current.created_at)).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  const statusLabel =
    current?.status === "valide"
      ? "Validé"
      : current?.status === "en_validation"
        ? "En validation"
        : current?.status === "prospect"
          ? "Prospect"
          : current?.status
            ? String(current.status)
            : "—"

  const statusVariant =
    current?.status === "valide"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : current?.status === "en_validation"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-muted text-muted-foreground"

  return (
    <div className="space-y-4">
      {/* Mini-hero Paiements — Wave Mobile Money style, 1-tap pour régler */}
      {!feesLoading && totalExpected > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide opacity-80">Reste à payer</p>
              <p className="mt-1 font-serif text-2xl sm:text-3xl">{formatFCFA(feesRemaining)}</p>
              <p className="mt-1 text-xs opacity-80">
                {formatFCFA(totalPaid)} payés sur {formatFCFA(totalExpected)}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="h-11 w-full gap-2 sm:h-9 sm:w-auto"
              onClick={() => onTabChange?.("paiements")}
            >
              <Wallet className="h-4 w-4" />
              Voir les paiements
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all"
              style={{ width: `${feesRate}%` }}
            />
          </div>
        </div>
      )}

      {/* 2 KPI cards seulement : Classe (lien) + Statut (badge) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {current?.class_id ? (
          <Link
            href={`/admin/classes/${current.class_id as number}` as never}
            className="group block"
          >
            <Card className="border-0 shadow-sm ring-1 ring-border transition-colors group-hover:ring-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Classe</p>
                    <p className="truncate text-sm font-semibold">
                      {String(current.class_name ?? "")}
                    </p>
                    {enrolledOn && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Inscrit le {enrolledOn}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="border-0 shadow-sm ring-1 ring-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Classe</p>
                  <p className="text-sm font-semibold text-muted-foreground">Non inscrit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${statusVariant}`}
              >
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <StatusPill
                    tone={
                      current?.status === "valide"
                        ? "success"
                        : current?.status === "en_validation"
                          ? "warning"
                          : current?.status
                            ? "neutral"
                            : "neutral"
                    }
                  >
                    {statusLabel}
                  </StatusPill>
                </div>
                {current?.academic_year_name ? (
                  <p className="mt-1 text-xs font-medium">
                    {String(current.academic_year_name)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Aucune inscription</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini-progress des frais — visible même sans hero (élève sans frais configurés) */}
      {!feesLoading && totalExpected > 0 && (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taux de paiement</p>
                  <p className="text-sm font-semibold">{feesRate}%</p>
                </div>
              </div>
              <StatusPill
                tone={feesRate >= 100 ? "success" : feesRate >= 50 ? "warning" : "danger"}
              >
                {feesRate >= 100 ? "Soldé" : feesRate >= 50 ? "En cours" : "À régler"}
              </StatusPill>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, feesRate)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parents inline — 1 ligne par parent avec téléphone clickable tel: */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Parents
              {parents && parents.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {parents.length}
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => onTabChange?.("parents")}
              className="text-xs font-medium text-primary hover:underline"
            >
              Gérer →
            </button>
          </div>
          {parentsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : parentsError ? (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Impossible de charger les parents.
              </p>
              <button
                type="button"
                onClick={() => refetchParents()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : !parents || parents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/20 px-4 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Aucun parent lié</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ajoutez le père, la mère ou le tuteur pour activer les notifications
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTabChange?.("parents")}
                className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Lier un parent →
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {parents.slice(0, 2).map((p) => {
                const parent = p as Record<string, unknown>
                const fn = String(parent.first_name ?? "")
                const ln = String(parent.last_name ?? "")
                const phone = parent.phone as string | null | undefined
                const rel = parent.relationship_type as string | null | undefined
                const relLabel =
                  rel === "father"
                    ? "Père"
                    : rel === "mother"
                      ? "Mère"
                      : rel === "guardian"
                        ? "Tuteur"
                        : ""
                const relTone =
                  rel === "father"
                    ? "bg-primary/10 text-primary"
                    : rel === "mother"
                      ? "bg-[rgba(245,130,32,0.12)] text-[#F58220]"
                      : "bg-muted text-muted-foreground"
                const initials = `${ln[0] ?? ""}${fn[0] ?? ""}`.toUpperCase() || "?"
                return (
                  <li
                    key={String(parent.id)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${relTone}`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {ln} {fn}
                        </p>
                        {relLabel && (
                          <span className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${relTone}`}>
                            {relLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        className="flex h-11 shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary sm:h-9"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Appeler
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pas de téléphone</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
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
