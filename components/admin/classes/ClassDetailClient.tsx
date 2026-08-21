"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Pencil,
  School,
  Trash2,
  Users,
} from "lucide-react"
import { useClass, useDeleteClass } from "@/lib/hooks/useClasses"
import { useTimetable } from "@/lib/hooks/useTimetable"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataError } from "@/components/shared/DataError"
import { PageHero, heroGlassBtn, type HeroKpi } from "@/components/shared/PageHero"
import { ClassEditModal } from "./ClassEditModal"
import { OverviewTab } from "./detail/OverviewTab"
import { StudentsTab } from "./detail/StudentsTab"
import { TimetableTab } from "./detail/TimetableTab"
import { SubjectsTab } from "./detail/SubjectsTab"
import { TeachersTab } from "./detail/TeachersTab"
import { deriveSubjects, deriveTeachers } from "./detail/class-helpers"

interface ClassDetailClientProps {
  classId: number
}

export function ClassDetailClient({ classId }: ClassDetailClientProps) {
  const router = useRouter()
  const { data: classData, isLoading, isError, error, refetch } = useClass(classId)
  // Les slots EDT alimentent les KPIs du hero + l'onglet Aperçu (matières / profs).
  const { data: slots } = useTimetable(classId)
  const deleteMutation = useDeleteClass()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full max-w-md rounded-md" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !classData) {
    return (
      <div className="p-4 md:p-6">
        <DataError message={error?.message ?? "Classe introuvable"} error={error} onRetry={refetch} />
      </div>
    )
  }

  const allSlots = slots ?? []
  const enrolled = classData.enrolled_count ?? 0
  const max = classData.max_students ?? 0
  const ratio = max > 0 ? Math.round((enrolled / max) * 100) : 0

  const kpis: HeroKpi[] = [
    {
      label: "Effectif",
      value: max > 0 ? `${enrolled}/${max}` : enrolled,
      icon: Users,
      hint: max > 0 ? `${ratio}% rempli` : "Capacité non définie",
    },
    { label: "Niveau", value: classData.level_name ?? "—", icon: GraduationCap },
    { label: "Matières", value: deriveSubjects(allSlots).length, icon: BookOpen },
    { label: "Enseignants", value: deriveTeachers(allSlots).length, icon: School },
  ]

  const subtitle = (
    <>
      {classData.level_name}
      {classData.series_name ? ` · Série ${classData.series_name}` : ""}
      {classData.room_id ? ` · Salle ${classData.name}` : ""}
    </>
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHero
        icon={School}
        title={classData.name}
        subtitle={subtitle}
        actions={
          <>
            <button
              type="button"
              onClick={() => router.push("/admin/classes")}
              className={heroGlassBtn}
              aria-label="Retour à la liste des classes"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className={heroGlassBtn}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Modifier
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className={heroGlassBtn}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Supprimer
            </button>
          </>
        }
        kpis={kpis}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto w-max max-w-none gap-1 p-1">
            <TabsTrigger value="overview" className="h-9 whitespace-nowrap">
              <School className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="students" className="h-9 whitespace-nowrap">
              <Users className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Élèves
            </TabsTrigger>
            <TabsTrigger value="timetable" className="h-9 whitespace-nowrap">
              <CalendarDays className="mr-1.5 h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Emploi du temps</span>
              <span className="sm:hidden">EDT</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="h-9 whitespace-nowrap">
              <BookOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Matières
            </TabsTrigger>
            <TabsTrigger value="teachers" className="h-9 whitespace-nowrap">
              <GraduationCap className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Enseignants
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab classData={classData} slots={allSlots} />
        </TabsContent>
        <TabsContent value="students">
          <StudentsTab classId={classId} className={classData.name} />
        </TabsContent>
        <TabsContent value="timetable">
          <TimetableTab classId={classId} />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsTab classId={classId} />
        </TabsContent>
        <TabsContent value="teachers">
          <TeachersTab classId={classId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ClassEditModal classId={editOpen ? classId : null} open={editOpen} onClose={() => setEditOpen(false)} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la classe</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La classe « {classData.name} » sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate(classId, {
                  onSuccess: () => router.push("/admin/classes"),
                })
              }}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
