"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarCheck, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useTeacherClasses,
  useTeacherClassRoster,
  teacherPortalKeys,
} from "@/lib/hooks/useTeacherPortal"
import { attendanceApi } from "@/lib/api/attendance"

type Status = "present" | "absent" | "late" | "excused"

const STATUSES: { key: Status; label: string; short: string; on: string }[] = [
  { key: "present", label: "Présent", short: "P", on: "bg-emerald-600 text-white border-emerald-600" },
  { key: "absent", label: "Absent", short: "A", on: "bg-rose-600 text-white border-rose-600" },
  { key: "late", label: "Retard", short: "R", on: "bg-amber-500 text-white border-amber-500" },
  { key: "excused", label: "Excusé", short: "E", on: "bg-blue-600 text-white border-blue-600" },
]

function todayISO(): string {
  const d = new Date()
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export function AppelSheet() {
  const queryClient = useQueryClient()
  const { data: classes, isLoading: classesLoading } = useTeacherClasses()
  const [classId, setClassId] = useState<number | undefined>(undefined)
  const [date, setDate] = useState<string>(todayISO())
  const [statuses, setStatuses] = useState<Record<number, Status>>({})

  const { data: roster, isLoading: rosterLoading } = useTeacherClassRoster(classId)

  // Défaut : tous présents (l'enseignant ne bascule que les absents)
  useEffect(() => {
    if (roster) {
      setStatuses(Object.fromEntries(roster.students.map((s) => [s.student_id, "present" as Status])))
    }
  }, [roster])

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0 }
    Object.values(statuses).forEach((s) => (c[s] += 1))
    return c
  }, [statuses])

  const mutation = useMutation({
    mutationFn: () => {
      if (!roster) throw new Error("Aucune classe sélectionnée")
      return attendanceApi.createSession({
        entity_type: "class",
        context_id: roster.class_id,
        date,
        academic_year_id: roster.academic_year_id,
        records: roster.students.map((s) => ({
          student_id: s.student_id,
          status: statuses[s.student_id] ?? "present",
        })),
      })
    },
    onSuccess: () => {
      toast.success("Appel enregistré", {
        description: `${counts.present} présent(s), ${counts.absent} absent(s).`,
      })
      if (classId) {
        queryClient.invalidateQueries({ queryKey: teacherPortalKeys.classAttendance(classId) })
      }
    },
    onError: (err) => {
      toast.error("Erreur", { description: err instanceof Error ? err.message : "Enregistrement impossible" })
    },
  })

  function setAll(status: Status) {
    if (!roster) return
    setStatuses(Object.fromEntries(roster.students.map((s) => [s.student_id, status])))
  }

  // --- Class picker ---
  const classList = classes ?? []

  return (
    <div className="space-y-4">
      {/* Sélection de la classe */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Classe</p>
        {classesLoading ? (
          <div className="flex gap-2">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="h-11 w-28" />
          </div>
        ) : classList.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Aucune classe assignée. Contactez l&apos;administration.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classList.map((c) => (
              <button
                key={c.class_id}
                type="button"
                onClick={() => setClassId(c.class_id)}
                className={`h-11 rounded-lg border px-4 text-sm font-medium transition-colors ${
                  classId === c.class_id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/70 text-foreground"
                }`}
              >
                {c.class_name}
                <span className="ml-1.5 text-xs opacity-70">{c.subject_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {classId && (
        <>
          {/* Date + résumé + tout présent */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label htmlFor="appel-date" className="mb-1 block text-sm font-medium text-muted-foreground">
                Date
              </label>
              <input
                id="appel-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 sm:h-10"
              onClick={() => setAll("present")}
              disabled={rosterLoading || !roster?.students.length}
            >
              <Users className="mr-2 h-4 w-4" />
              Tout présent
            </Button>
          </div>

          {/* Liste des élèves */}
          {rosterLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !roster?.students.length ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aucun élève inscrit dans cette classe pour l&apos;année en cours.
            </p>
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {roster.students.map((s) => {
                  const current = statuses[s.student_id] ?? "present"
                  return (
                    <div
                      key={s.student_id}
                      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {s.photo_url ? <AvatarImage src={s.photo_url} alt={`${s.first_name} ${s.last_name}`} /> : null}
                          <AvatarFallback className="text-xs">{initials(s.first_name, s.last_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {s.last_name} {s.first_name}
                          </p>
                          {s.matricule ? (
                            <p className="truncate text-xs text-muted-foreground">{s.matricule}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 sm:flex">
                        {STATUSES.map((st) => (
                          <button
                            key={st.key}
                            type="button"
                            aria-label={`${st.label} — ${s.first_name} ${s.last_name}`}
                            onClick={() => setStatuses((prev) => ({ ...prev, [s.student_id]: st.key }))}
                            className={`h-11 rounded-md border text-xs font-semibold transition-colors sm:h-9 sm:w-14 ${
                              current === st.key
                                ? st.on
                                : "border-input bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <span className="sm:hidden">{st.short}</span>
                            <span className="hidden sm:inline">{st.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Barre de soumission */}
          {roster?.students.length ? (
            <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-background/95 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-emerald-600">{counts.present} présent(s)</span>
                {" · "}
                <span className="font-medium text-rose-600">{counts.absent} absent(s)</span>
                {counts.late ? <span className="text-amber-600"> · {counts.late} retard(s)</span> : null}
                {counts.excused ? <span className="text-blue-600"> · {counts.excused} excusé(s)</span> : null}
              </p>
              <Button
                type="button"
                className="h-11 sm:h-10"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarCheck className="mr-2 h-4 w-4" />
                )}
                Enregistrer l&apos;appel
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
