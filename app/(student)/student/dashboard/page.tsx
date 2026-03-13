import { CalendarDays, ClipboardList, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Accueil Eleve | KLASSCI" }

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Espace Eleve</h1>
        <p className="text-sm text-muted-foreground">
          Votre resume du jour
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

      {/* Recent grades placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Dernieres notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fees placeholder */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Solde frais scolaires</p>
              <p className="text-xs text-muted-foreground">En attente de l&apos;API</p>
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </CardContent>
      </Card>
    </div>
  )
}
