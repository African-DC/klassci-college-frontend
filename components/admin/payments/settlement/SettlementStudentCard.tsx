import { CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SettlementBadge } from "@/components/admin/payments/settlement/SettlementBadge"
import type { SettlementColumn, SettlementRow } from "@/lib/contracts/fee-settlement"

/**
 * Un élève sur un téléphone.
 *
 * Le tableau ne se transpose pas sur 5,5 pouces : huit colonnes à faire
 * défiler de côté, c'est huit occasions de perdre la ligne qu'on lisait. Une
 * carte par élève, ses catégories dessous, et la question du guichet — « est-il
 * en règle ? » — répondue en haut avant tout le reste.
 *
 * Les catégories non facturées ne sont pas rendues ici : sur un écran étroit,
 * une liste de tirets pousse dehors ce qu'on est venu lire.
 */
export function SettlementStudentCard({
  row,
  columns,
}: {
  row: SettlementRow
  columns: SettlementColumn[]
}) {
  const parCategorie = new Map(row.cells.map((cell) => [cell.category_id, cell]))
  const aMontrer = columns.filter((col) => parCategorie.get(col.category_id)?.state !== "absent")

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.last_name} {row.first_name}
            </p>
            {row.student_matricule ? (
              <p className="text-xs text-muted-foreground">{row.student_matricule}</p>
            ) : null}
          </div>
          {row.settled ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
              En règle
            </span>
          ) : null}
        </div>

        {aMontrer.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun frais à ce dossier.</p>
        ) : (
          <dl className="space-y-1.5">
            {aMontrer.map((col) => {
              const cell = parCategorie.get(col.category_id)
              if (!cell) return null
              return (
                <div key={col.category_id} className="flex items-center justify-between gap-3">
                  <dt className="truncate text-xs text-muted-foreground">{col.name}</dt>
                  <dd className="shrink-0">
                    <SettlementBadge cell={cell} />
                  </dd>
                </div>
              )
            })}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
