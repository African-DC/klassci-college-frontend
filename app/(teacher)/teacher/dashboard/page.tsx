import { CalendarDays, AlertTriangle, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Accueil Enseignant | KLASSCI" }

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Bonjour, Enseignant</h1>
        <p className="text-sm text-muted-foreground">
          Voici votre journee en un coup d&apos;oeil
        </p>
      </div>

      {/* Next course highlight */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">Prochain cours</p>
            <p className="text-base font-bold truncate">Mathematiques — 6eA</p>
            <p className="text-sm text-muted-foreground">10:00 - 11:00 | Salle 204</p>
          </div>
        </CardContent>
      </Card>

      {/* Today's courses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cours du jour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { time: "08:00 - 09:00", subject: "Physique", class: "5eB", room: "Lab 1" },
            { time: "10:00 - 11:00", subject: "Mathematiques", class: "6eA", room: "Salle 204" },
            { time: "14:00 - 15:00", subject: "Mathematiques", class: "4eC", room: "Salle 102" },
          ].map((course) => (
            <div key={course.time} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{course.subject} — {course.class}</p>
                <p className="text-xs text-muted-foreground">{course.room}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{course.time}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Notes manquantes</p>
              <p className="text-xs text-muted-foreground">3 evaluations a saisir</p>
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
              <p className="text-xs text-muted-foreground">5 eleves aujourd&apos;hui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
