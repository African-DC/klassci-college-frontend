import type { Metadata } from "next"
import { StudentAttendanceClient } from "@/components/student/StudentAttendanceClient"

export const metadata: Metadata = {
  title: "Pr\u00e9sences | KLASSCI",
  description: "Historique de pr\u00e9sence",
}

export default function StudentAttendancePage() {
  return <StudentAttendanceClient />
}
