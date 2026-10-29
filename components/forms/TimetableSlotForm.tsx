"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { TimetableSlotCreateSchema, type TimetableSlotCreate } from "@/lib/contracts/timetable"
import { useCreateSlot, useTeacherWeek, useUpdateSlot } from "@/lib/hooks/useTimetable"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { useSubjects } from "@/lib/hooks/useSubjects"
import { useClass } from "@/lib/hooks/useClasses"
import { useClassSubjectTeachers } from "@/lib/hooks/useClassSubjectTeachers"
import { useRooms } from "@/lib/hooks/useRooms"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { ChampsDuCreneau } from "@/components/forms/timetable-slot/ChampsDuCreneau"
import { SubjectField } from "@/components/forms/timetable-slot/SubjectField"
import { TeacherField } from "@/components/forms/timetable-slot/TeacherField"
import { ClassTeachersDialog } from "@/components/admin/timetable/class-teachers/ClassTeachersDialog"
import { Badge } from "@/components/ui/badge"
import { TeacherWeekPanel } from "@/components/timetable/TeacherWeekPanel"
import type { PlageChoisie } from "@/components/timetable/week-grid/use-selection-glissee"
import { trouverEmpechement } from "@/lib/timetable/week-overlap"
import { JOURS_FR } from "@/lib/timetable/semaine"
import {
  InlineCreateSubjectDialog,
  InlineCreateTeacherDialog,
  addHour,
} from "@/components/forms/timetable-slot/inline-create-dialogs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"


interface TimetableSlotFormProps {
  defaultDay?: string
  defaultStartTime?: string
  defaultEndTime?: string
  classId?: number
  slot?: TimetableSlot
  onSuccess: () => void
}

export function TimetableSlotForm({
  defaultDay,
  defaultStartTime,
  defaultEndTime,
  classId,
  slot,
  onSuccess,
}: TimetableSlotFormProps) {
  const isEdit = !!slot
  const effectiveClassId = classId ?? slot?.class_id

  // Inline create dialogs
  const [showCreateSubject, setShowCreateSubject] = useState(false)
  const [showCreateTeacher, setShowCreateTeacher] = useState(false)

  // Fetch class to get level_id/series_id for subject filtering
  const { data: classData } = useClass(effectiveClassId ?? 0)

  // Subjects filtered by level of the class
  const { data: subjectsData } = useSubjects(
    classData?.level_id ? { level_id: classData.level_id, size: 100 } : { size: 100 },
  )
  const subjects = subjectsData?.items ?? []

  // Enseignants retenus par matière dans cette classe : ils fixent le choix du créneau.
  const classTeachers = useClassSubjectTeachers(effectiveClassId)
  const teacherStatus = classTeachers.isError ? "error" : classTeachers.data ? "ready" : "loading"

  // Rooms — only show: 1) the class's assigned room, 2) non-classroom rooms (labos, etc.)
  const { data: roomsData } = useRooms({ size: 100 })
  const allRooms = roomsData?.items ?? []
  const filteredRooms = useMemo(() => {
    return allRooms.filter((r) => {
      // Show the room assigned to this class (room.id matches class.room_id)
      if (classData?.room_id && r.id === classData.room_id) return true
      // Show rooms linked to this class (room.class_id matches class.id)
      if (effectiveClassId && r.class_id === effectiveClassId) return true
      // Show non-classroom rooms (labos, salle info, etc.)
      if (r.room_type !== "classroom") return true
      // Hide other classes' classroom rooms
      return false
    })
  }, [allRooms, classData, effectiveClassId])

  // Current academic year
  const { data: yearsData } = useAcademicYears()
  const currentYear = yearsData?.items?.find((y) => y.is_current)

  const form = useForm<TimetableSlotCreate>({
    resolver: zodResolver(TimetableSlotCreateSchema),
    defaultValues: isEdit
      ? {
          day: slot.day,
          start_time: slot.start_time,
          end_time: slot.end_time,
          class_id: slot.class_id,
          teacher_id: slot.teacher_id,
          subject_id: slot.subject_id,
          academic_year_id: slot.academic_year_id,
          room: slot.room ?? "",
        }
      : {
          day: defaultDay as TimetableSlotCreate["day"] | undefined,
          start_time: defaultStartTime ?? "",
          end_time: defaultEndTime ?? (defaultStartTime ? addHour(defaultStartTime) : ""),
          class_id: classId,
          academic_year_id: currentYear?.id,
          room: "",
        },
  })

  // La semaine de l'enseignant choisi, chargee des qu'il est choisi : elle
  // sert a montrer l'empechement pendant la saisie, au lieu de le decouvrir en
  // validant. Le backend refait la verification, celle-ci ne fait qu'avertir.
  const selectedSubjectId = form.watch("subject_id")
  const assignedSubject = classTeachers.data?.items.find((item) => item.subject_id === selectedSubjectId)
  const prefilledRoomClass = useRef<number | null>(null)

  // Resolve the teacher even if the subject was selected before the server
  // finished loading the class assignments. Never rewrite an existing slot.
  useEffect(() => {
    if (isEdit || !assignedSubject?.resolved_teacher_id) return
    if (!form.getValues("teacher_id")) {
      form.setValue("teacher_id", assignedSubject.resolved_teacher_id, {
        shouldValidate: true,
      })
    }
  }, [assignedSubject, form, isEdit])

  // Suggest the classroom only once. Subsequent manual changes remain intact.
  useEffect(() => {
    if (isEdit || !effectiveClassId || !classData?.room_id) return
    if (prefilledRoomClass.current === effectiveClassId) return
    const classroom = allRooms.find((room) => room.id === classData.room_id)
    if (!classroom) return
    prefilledRoomClass.current = effectiveClassId
    if (!form.getValues("room")) form.setValue("room", classroom.name)
  }, [allRooms, classData?.room_id, effectiveClassId, form, isEdit])

  async function refreshClassAssignment() {
    const refreshed = await classTeachers.refetch()
    const subjectId = form.getValues("subject_id")
    if (!isEdit && subjectId) {
      const resolved = refreshed.data?.items.find((item) => item.subject_id === subjectId)?.resolved_teacher_id
      form.setValue("teacher_id", (resolved ?? undefined) as number, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  const selectedTeacherId = form.watch("teacher_id")
  const watchedDay = form.watch("day")
  const watchedStart = form.watch("start_time")
  const watchedEnd = form.watch("end_time")
  const { data: teacherWeek, isLoading: weekLoading } = useTeacherWeek(selectedTeacherId)

  // En modification, le creneau qu'on deplace figure dans sa propre semaine :
  // sans cela, il se signalerait lui-meme comme conflit.
  const weekSansCeCreneau = useMemo(() => {
    if (!teacherWeek || !slot) return teacherWeek
    return {
      ...teacherWeek,
      busy: teacherWeek.busy.filter(
        (b) =>
          !(
            b.kind === "course" &&
            b.start_time === slot.start_time &&
            b.end_time === slot.end_time &&
            b.class_name === slot.class_name
          ),
      ),
    }
  }, [teacherWeek, slot])

  /**
   * Ce qui a ete trace sur la grille devient la saisie.
   *
   * Le formulaire stocke le jour en francais, la grille raisonne en anglais :
   * la traduction se fait ici, au seul endroit ou les deux se rencontrent.
   */
  const choisirSurLaGrille = useCallback(
    (plage: PlageChoisie) => {
      form.setValue("day", JOURS_FR[plage.jour], { shouldValidate: true, shouldDirty: true })
      // La plage arrive deja en « HH:MM » : la reformater y ajoutait des
      // secondes, que le schema refuse.
      form.setValue("start_time", plage.debut, { shouldValidate: true, shouldDirty: true })
      form.setValue("end_time", plage.fin, { shouldValidate: true, shouldDirty: true })
    },
    [form],
  )

  const empechement = trouverEmpechement(
    weekSansCeCreneau,
    watchedDay,
    watchedStart,
    watchedEnd,
  )

  const createMutation = useCreateSlot()
  const updateMutation = useUpdateSlot(slot?.id ?? 0)
  const mutation = isEdit ? updateMutation : createMutation
  const isPending = mutation.isPending
  const error = mutation.error

  function onSubmit(data: TimetableSlotCreate) {
    // Auto-set academic_year_id if not set
    const payload = {
      ...data,
      academic_year_id: data.academic_year_id || currentYear?.id,
    }
    if (!payload.academic_year_id) {
      toast.error("Aucune année scolaire active : configurez-la avant d’ajouter un créneau.")
      return
    }
    if (isEdit) {
      updateMutation.mutate(
        {
          teacher_id: payload.teacher_id,
          subject_id: payload.subject_id,
          day: payload.day,
          start_time: payload.start_time,
          end_time: payload.end_time,
          room: payload.room,
        },
        { onSuccess },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          form.reset()
          onSuccess()
        },
      })
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-4">
          <div className="min-w-0 lg:grid lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
            <div className="min-w-0 space-y-4">
              {/* Subject select — filtered by class level */}
              <SubjectField
                form={form}
                subjects={subjects}
                items={classTeachers.data?.items}
                onCreateSubject={() => setShowCreateSubject(true)}
              />

              <TeacherField
                form={form}
                items={classTeachers.data?.items}
                status={teacherStatus}
                currentTeacher={
                  isEdit && slot ? { id: slot.teacher_id, name: slot.teacher_name } : undefined
                }
                onRetry={() => void classTeachers.refetch()}
                onCreateTeacher={() => setShowCreateTeacher(true)}
              />

              {effectiveClassId && selectedSubjectId && (
                <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {assignedSubject?.resolved_teacher_id ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Affectation de la classe
                      </Badge>
                    ) : (
                      <Badge variant="outline">Affectation à compléter</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {assignedSubject?.resolved_teacher_id
                        ? "L’enseignant retenu est proposé automatiquement."
                        : "Définissez l’enseignant de cette matière pour cette classe."}
                    </span>
                  </div>
                  <ClassTeachersDialog
                    classId={effectiveClassId}
                    compact
                    onSaved={() => void refreshClassAssignment()}
                  />
                </div>
              )}

              <ChampsDuCreneau
                form={form}
                empechement={empechement}
                erreurServeur={Boolean(error)}
              />

              {/* Room select */}
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salle</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Sélectionner une salle (optionnel)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune salle</SelectItem>
                        {filteredRooms.map((r) => (
                          <SelectItem key={r.id} value={r.name}>
                            {r.name} {r.capacity ? `(${r.capacity} places)` : ""} {r.room_type !== "classroom" ? `— ${r.room_type}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            {/* La semaine a cote des champs, et non au-dessus : on doit voir les
                heures se remplir pendant qu'on les trace. */}
            <div className="mt-4 min-w-0 lg:mt-0">
              {selectedTeacherId ? (
                <TeacherWeekPanel
                  week={weekSansCeCreneau}
                  isLoading={weekLoading}
                  highlightDay={watchedDay}
                  highlightStart={watchedStart}
                  highlightEnd={watchedEnd}
                  editHref={`/admin/teachers/${selectedTeacherId}?tab=disponibilites`}
                  onChoisir={choisirSurLaGrille}
                />
              ) : (
                <div className="hidden rounded-xl border border-dashed bg-muted/20 p-6 text-center lg:block">
                  <p className="text-sm text-muted-foreground">
                    Choisissez un enseignant pour voir sa semaine et y tracer le créneau.
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-destructive">
                  Enregistrement refusé
                </p>
                <p className="text-sm text-destructive/90">{error.message}</p>
              </div>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending}>
            {isPending
              ? "Enregistrement..."
              : isEdit
                ? "Enregistrer les modifications"
                : "Ajouter le créneau"}
          </Button>
        </form>
      </Form>

      {/* Inline create subject dialog */}
      <InlineCreateSubjectDialog
        open={showCreateSubject}
        onClose={() => setShowCreateSubject(false)}
        onCreated={(id) => {
          form.setValue("subject_id", id)
          setShowCreateSubject(false)
        }}
      />

      {/* Inline create teacher dialog */}
      <InlineCreateTeacherDialog
        open={showCreateTeacher}
        onClose={() => setShowCreateTeacher(false)}
        onCreated={(id) => {
          form.setValue("teacher_id", id)
          setShowCreateTeacher(false)
        }}
      />
    </>
  )
}
