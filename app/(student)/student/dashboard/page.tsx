import type { Metadata } from "next"
import { StudentDashboardClient } from "@/components/student/StudentDashboardClient"

export const metadata: Metadata = {
  title: "Accueil Élève — KLASSCI",
  description: "Tableau de bord de l'élève",
}

export default function StudentDashboardPage() {
  return <StudentDashboardClient />
}
