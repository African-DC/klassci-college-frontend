import { Card, CardContent } from "@/components/ui/card"
import { SettlementBadge } from "@/components/admin/payments/settlement/SettlementBadge"
import type { SettlementMatrix } from "@/lib/contracts/fee-settlement"

/**
 * Le tableau de bureau : une ligne par élève, une colonne par catégorie.
 *
 * La colonne des noms reste visible quand on fait défiler de côté. Sans elle,
 * huit catégories plus loin, on lit des états sans savoir de qui ils parlent —
 * et c'est exactement le moment où l'on relance la mauvaise famille.
 */
export function SettlementTable({ matrix }: { matrix: SettlementMatrix }) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2.5 text-left font-medium backdrop-blur">
                  Élève
                </th>
                {matrix.columns.map((col) => (
                  <th key={col.category_id} className="px-3 py-2.5 text-left font-medium">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.enrollment_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-background px-3 py-2.5">
                    <span className="font-medium">
                      {row.last_name} {row.first_name}
                    </span>
                    {row.student_matricule ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {row.student_matricule}
                      </span>
                    ) : null}
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.category_id} className="px-3 py-2.5">
                      <SettlementBadge cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
