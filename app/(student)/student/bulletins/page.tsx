import type { Metadata } from "next"
import { StudentBulletinsClient } from "@/components/student/StudentBulletinsClient"

export const metadata: Metadata = {
  title: "Mes bulletins — KLASSCI",
  description: "Bulletins scolaires publiés",
}

export default function StudentBulletinsPage() {
  return <StudentBulletinsClient />
}
