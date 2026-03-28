import type { Metadata } from "next"
import { StudentFeesClient } from "@/components/student/StudentFeesClient"

export const metadata: Metadata = {
  title: "Frais scolaires — KLASSCI",
  description: "Suivi des frais et paiements",
}

export default function StudentFeesPage() {
  return <StudentFeesClient />
}
