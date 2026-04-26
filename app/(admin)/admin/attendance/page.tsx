import type { Metadata } from "next"
import { AttendancePageClient } from "@/components/admin/attendance/AttendancePageClient"

export const metadata: Metadata = {
  title: "Présences — KLASSCI",
  description: "Gestion des présences et pointage par session de cours",
}

export default function AttendancePage() {
  return <AttendancePageClient />
}
