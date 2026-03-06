import { UserX, ClipboardList, Wallet, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export const metadata = { title: "Accueil Parent | KLASSCI" }

const children = [
  {
    name: "Marie Kabila",
    class: "6eA",
    absences: 2,
    lastGrade: { subject: "Maths", value: 16.5 },
    fees: { paid: 800, total: 1200 },
  },
  {
    name: "Jean Kabila",
    class: "4eC",
    absences: 0,
    lastGrade: { subject: "Francais", value: 13 },
    fees: { paid: 1200, total: 1200 },
  },
]

export default function ParentDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Bonjour, Parent</h1>
        <p className="text-sm text-muted-foreground">
          Resume de vos enfants
        </p>
      </div>

      {children.map((child, index) => (
        <Card key={child.name}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{child.name}</span>
              <Badge variant="secondary" className="text-xs">{child.class}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Absences */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Absences recentes</span>
              </div>
              <Badge variant={child.absences > 0 ? "destructive" : "outline"} className="text-xs">
                {child.absences} absence{child.absences !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Last grade */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Derniere note — {child.lastGrade.subject}</span>
              </div>
              <span className="text-sm font-bold text-primary">{child.lastGrade.value}/20</span>
            </div>

            {/* Fees */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Frais scolaires</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {child.fees.paid}/{child.fees.total} $
                </span>
                {child.fees.paid >= child.fees.total ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
                    Solde
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    {child.fees.total - child.fees.paid} $ restant
                  </Badge>
                )}
              </div>
            </div>

            {/* View details link */}
            <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              Voir le detail
              <ChevronRight className="h-3 w-3" />
            </button>

            {index < children.length - 1 && <Separator className="mt-2" />}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
