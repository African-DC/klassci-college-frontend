import { GradesSupervisor } from "@/components/admin/grades/GradesSupervisor"

export const metadata = { title: "Notes — Supervision | KLASSCI" }

export default function GradesAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Supervision des notes</h1>
        <p className="text-muted-foreground">
          Suivez l&apos;avancement de la saisie des notes par evaluation
        </p>
      </div>

      <GradesSupervisor />
    </div>
  )
}
