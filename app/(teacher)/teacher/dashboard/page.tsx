import { CalendarDays, AlertTriangle, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataError } from "@/components/shared/DataError"

export const metadata = { title: "Accueil Enseignant | KLASSCI" }

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Espace Enseignant</h1>
        <p className="text-sm text-muted-foreground">
          Votre journee en un coup d&apos;oeil
        </p>
      </div>

      {/* Next course */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">Prochain cours</p>
            <p className="text-sm text-muted-foreground mt-1">Aucun cours programme</p>
          </div>
        </CardContent>
      </Card>

      {/* Courses & alerts — awaiting dedicated endpoints */}
      <DataError
        message="Les donnees enseignant necessitent les endpoints /teacher/schedule et /teacher/alerts (a venir)"
        compact
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Notes manquantes</p>
              <p className="text-xs text-muted-foreground">Aucune alerte</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Absences signalees</p>
              <p className="text-xs text-muted-foreground">Aucune absence</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
