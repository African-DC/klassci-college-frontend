import { Users, ClipboardList, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Accueil Parent | KLASSCI" }

export default function ParentDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Espace Parent</h1>
        <p className="text-sm text-muted-foreground">
          Resume de vos enfants
        </p>
      </div>

      {/* Children summary — will be loaded from API */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            Mes enfants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Chargement depuis l&apos;API...
            </p>
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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Frais scolaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-16 items-center justify-center rounded-lg border border-dashed bg-muted/20">
            <p className="text-sm text-muted-foreground">
              En attente de l&apos;API backend
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
