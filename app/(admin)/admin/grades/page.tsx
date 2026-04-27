import { GradesSupervisor } from "@/components/admin/grades/GradesSupervisor"

export const metadata = { title: "Notes — Supervision | KLASSCI" }

export default function GradesAdminPage() {
  // Le hero (titre + KPIs) est rendu dans GradesSupervisor pour cohérence
  // visuelle avec les autres pages admin (Premium hero pattern).
  return <GradesSupervisor />
}
