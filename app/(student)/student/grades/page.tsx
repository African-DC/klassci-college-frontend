import type { Metadata } from "next"
import { StudentGradesClient } from "@/components/student/StudentGradesClient"

export const metadata: Metadata = {
  title: "Mes notes — KLASSCI",
  description: "Notes par matière et trimestre",
}

export default function StudentGradesPage() {
  return <StudentGradesClient />
}
