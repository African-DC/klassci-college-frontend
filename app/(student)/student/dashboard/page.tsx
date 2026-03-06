import { CalendarDays, ClipboardList, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Accueil Eleve | KLASSCI" }

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Bonjour, Eleve</h1>
        <p className="text-sm text-muted-foreground">
          Voici votre resume du jour
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
            <p className="text-base font-bold truncate">Francais — M. Kabongo</p>
            <p className="text-sm text-muted-foreground">10:00 - 11:00 | Salle 301</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent grades */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Dernieres notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { subject: "Mathematiques", type: "Devoir", grade: 16.5, max: 20, date: "28 fev" },
            { subject: "Physique", type: "Interro", grade: 14, max: 20, date: "25 fev" },
            { subject: "Francais", type: "Composition", grade: 12.5, max: 20, date: "20 fev" },
          ].map((note) => (
            <div key={note.subject + note.date} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{note.subject}</p>
                <p className="text-xs text-muted-foreground">{note.type} — {note.date}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{note.grade}</p>
                <p className="text-[10px] text-muted-foreground">/{note.max}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fees */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Solde frais scolaires</p>
              <p className="text-xs text-muted-foreground">Annee 2025-2026</p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-sm font-bold px-3">
            250 $
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
