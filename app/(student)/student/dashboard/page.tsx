import { CalendarDays, ClipboardList, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataError } from "@/components/shared/DataError"

export const metadata = { title: "Accueil Eleve | KLASSCI" }

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Espace Eleve</h1>
        <p className="text-sm text-muted-foreground">
          Votre resume du jour
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

      {/* Grades & fees — awaiting dedicated endpoints */}
      <DataError
        message="Les donnees eleve necessitent les endpoints /grades/student et /fees/student (a venir)"
        compact
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Dernieres notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucune note disponible
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Solde frais scolaires</p>
              <p className="text-xs text-muted-foreground">Aucun frais enregistre</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
