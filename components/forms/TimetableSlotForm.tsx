"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Plus } from "lucide-react"
import { TimetableSlotCreateSchema, type TimetableSlotCreate } from "@/lib/contracts/timetable"
import { useCreateSlot, useTeacherWeek, useUpdateSlot } from "@/lib/hooks/useTimetable"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { useSubjects } from "@/lib/hooks/useSubjects"
import { useTeachers } from "@/lib/hooks/useTeachers"
import { useClass } from "@/lib/hooks/useClasses"
import { useRooms } from "@/lib/hooks/useRooms"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { TeacherWeekPanel } from "@/components/timetable/TeacherWeekPanel"
import { trouverEmpechement } from "@/lib/timetable/week-overlap"
import {
  InlineCreateSubjectDialog,
  InlineCreateTeacherDialog,
  addHour,
} from "@/components/forms/timetable-slot/inline-create-dialogs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const DAYS = [
  { value: "lundi", label: "Lundi" },
  { value: "mardi", label: "Mardi" },
  { value: "mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "vendredi", label: "Vendredi" },
  { value: "samedi", label: "Samedi" },
] as const

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

  // Teachers — only show the teacher assigned to the selected subject
  const { data: teachersData } = useTeachers({ size: 100 })
  const allTeachers = teachersData?.items ?? []

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

  const selectedSubjectId = form.watch("subject_id")
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  // Auto-select teacher when subject changes (if subject has assigned teacher)
  const prevSubjectRef = useMemo(() => ({ id: 0 }), [])
  if (selectedSubject?.teacher_id && selectedSubjectId !== prevSubjectRef.id) {
    prevSubjectRef.id = selectedSubjectId ?? 0
    form.setValue("teacher_id", selectedSubject.teacher_id)
  }

  // La semaine de l'enseignant choisi, chargee des qu'il est choisi : elle
  // sert a montrer l'empechement pendant la saisie, au lieu de le decouvrir en
  // validant. Le backend refait la verification, celle-ci ne fait qu'avertir.
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
      academic_year_id: data.academic_year_id || currentYear?.id || 1,
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Subject select — filtered by class level */}
          <FormField
            control={form.control}
            name="subject_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matière *</FormLabel>
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value?.toString() ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 flex-1">
                        <SelectValue placeholder="Sélectionner une matière" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name} (Coef. {s.coefficient}, {s.hours_per_week}h/sem)
                          {s.teacher_name ? ` — ${s.teacher_name}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={() => setShowCreateSubject(true)}
                    title="Créer une matière"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Teacher select */}
          <FormField
            control={form.control}
            name="teacher_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enseignant *</FormLabel>
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value?.toString() ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 flex-1">
                        <SelectValue placeholder="Sélectionner un enseignant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedSubject?.teacher_id && selectedSubject?.teacher_name ? (
                        /* Subject has an assigned teacher: show only that teacher */
                        <SelectItem value={selectedSubject.teacher_id.toString()}>
                          {selectedSubject.teacher_name}
                        </SelectItem>
                      ) : (
                        /* No assigned teacher: show all teachers */
                        allTeachers.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.first_name} {t.last_name} {t.speciality ? `(${t.speciality})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={() => setShowCreateTeacher(true)}
                    title="Créer un enseignant"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedTeacherId ? (
            <div className="rounded-xl border bg-card/60 p-3 sm:p-4">
              <TeacherWeekPanel
                week={weekSansCeCreneau}
                isLoading={weekLoading}
                highlightDay={watchedDay}
                highlightStart={watchedStart}
                highlightEnd={watchedEnd}
                editHref={`/admin/teachers/${selectedTeacherId}?tab=disponibilites`}
              />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jour *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Jour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Début *</FormLabel>
                  <FormControl>
                    <Input type="time" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin *</FormLabel>
                  <FormControl>
                    <Input type="time" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {empechement && !error && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Créneau impossible</p>
                <p className="text-sm text-muted-foreground">{empechement.message}</p>
              </div>
            </div>
          )}

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
