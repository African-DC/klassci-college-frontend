"use client"

import { TeacherScheduleView } from "@/components/teacher/timetable/TeacherScheduleView"

interface TeacherTimetableTabProps {
  teacherId: number
}

export function TeacherTimetableTab({ teacherId }: TeacherTimetableTabProps) {
  return <TeacherScheduleView teacherId={teacherId} />
}
