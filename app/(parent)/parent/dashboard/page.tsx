import { Users, ClipboardList, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataError } from "@/components/shared/DataError"

export const metadata = { title: "Accueil Parent | KLASSCI" }

export default function ParentDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Espace Parent</h1>
        <p className="text-sm text-muted-foreground">
          Resume de vos enfants
        </p>
      </div>

      {/* Data info */}
      <DataError
        message="Les donnees parent necessitent les endpoints /parent/children et /fees/children (a venir)"
        compact
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            Mes enfants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun enfant inscrit
          </p>
        </CardContent>
      </Card>

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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Frais scolaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun frais enregistre
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
