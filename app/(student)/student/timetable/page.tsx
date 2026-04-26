import type { Metadata } from "next"
import { StudentTimetableClient } from "@/components/student/StudentTimetableClient"

export const metadata: Metadata = {
  title: "Emploi du temps — KLASSCI",
  description: "Emploi du temps de la semaine",
}

export default function StudentTimetablePage() {
  return <StudentTimetableClient />
}
