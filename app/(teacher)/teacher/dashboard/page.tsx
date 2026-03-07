import { CalendarDays, AlertTriangle, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Accueil Enseignant | KLASSCI" }

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Espace Enseignant</h1>
        <p className="text-sm text-muted-foreground">
          Votre journee en un coup d&apos;oeil
        </p>
      </div>

      {/* Next course placeholder */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">Prochain cours</p>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Today's courses placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cours du jour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alerts placeholder */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Notes manquantes</p>
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <UserX className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Absences signalees</p>
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
