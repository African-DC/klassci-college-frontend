"use client"

import { CalendarDays, Clock, DoorClosed, User } from "lucide-react"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useTimetable } from "@/lib/hooks/useTimetable"
import { SectionCard, EmptyState } from "@/components/admin/students/tabs/_primitives"
import { dayLabel, formatTime, groupSlotsByDay } from "./class-helpers"

interface TimetableTabProps {
  classId: number
}

function SlotCard({ slot }: { slot: TimetableSlot }) {
  const color = slot.subject_color ?? "#0F3F8C"
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3">
      <span
        className="mt-1 h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{slot.subject_name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
          </span>
          {slot.teacher_name && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {slot.teacher_name}
            </span>
          )}
          {slot.room && (
            <span className="inline-flex items-center gap-1">
              <DoorClosed className="h-3.5 w-3.5" aria-hidden="true" />
              {slot.room}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function TimetableTab({ classId }: TimetableTabProps) {
  const { data, isLoading, isError, error, refetch } = useTimetable(classId)
  const slots = data ?? []
  const grouped = groupSlotsByDay(slots)

  return (
    <SectionCard
      icon={<CalendarDays className="h-4 w-4" />}
      title="Emploi du temps"
      description={isLoading ? undefined : `${slots.length} créneau${slots.length > 1 ? "x" : ""} programmé${slots.length > 1 ? "s" : ""}`}
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <DataError message={error?.message ?? "Erreur de chargement"} error={error} onRetry={refetch} />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="Aucun emploi du temps"
          message="Aucun créneau n'a encore été défini pour cette classe."
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(({ day, slots: daySlots }) => (
            <div key={day}>
              <div className="mb-2 flex items-center gap-2.5 border-b pb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <h4 className="text-sm font-semibold">{dayLabel(day)}</h4>
                <span className="text-xs text-muted-foreground">
                  {daySlots.length} cours
                </span>
              </div>
              <div className="space-y-2">
                {daySlots.map((slot) => (
                  <SlotCard key={slot.id} slot={slot} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
