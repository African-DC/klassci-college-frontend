"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useTeacherAttendanceStats } from "@/lib/hooks/useTeacherAttendance"
import { AttendanceStatsHero } from "../attendance/AttendanceStatsHero"
import { PendingValidationSection } from "../attendance/PendingValidationSection"
import { AttendanceHistoryList } from "../attendance/AttendanceHistoryList"
import { AttendanceRecordModal } from "../attendance/AttendanceRecordModal"

interface TeacherAttendanceTabProps {
  teacherId: number
}

export function TeacherAttendanceTab({ teacherId }: TeacherAttendanceTabProps) {
  const { data: yearsData } = useAcademicYears({ page: 1, size: 50 })
  const years = yearsData?.items ?? []
  const currentYear = years.find((y) => y.is_current)

  const [selectedYearId, setSelectedYearId] = useState<number | undefined>(
    undefined,
  )
  const activeYearId = selectedYearId ?? currentYear?.id

  const { data: stats, isLoading: statsLoading } = useTeacherAttendanceStats(
    teacherId,
    activeYearId,
  )

  const [recordOpen, setRecordOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select
            value={activeYearId ? String(activeYearId) : ""}
            onValueChange={(v) => setSelectedYearId(Number(v))}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Année scolaire" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.name}
                  {y.is_current ? " · en cours" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setRecordOpen(true)}
          className="h-11 font-semibold sm:h-9"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Saisir une absence
        </Button>
      </div>

      <AttendanceStatsHero stats={stats} isLoading={statsLoading} />

      <PendingValidationSection
        teacherId={teacherId}
        academicYearId={activeYearId}
      />

      <AttendanceHistoryList
        teacherId={teacherId}
        academicYearId={activeYearId}
      />

      <AttendanceRecordModal
        teacherId={teacherId}
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
      />
    </div>
  )
}
