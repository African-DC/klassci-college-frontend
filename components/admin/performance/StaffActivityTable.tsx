import Link from "next/link"
import { UserCog } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { StaffActivityItem } from "@/lib/contracts/performance"
import { formatXof } from "@/lib/export/format"

function lastLoginLabel(value: string | null | undefined): string {
  if (!value) return "Jamais connecté"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export function StaffActivityTable({ staff }: { staff: StaffActivityItem[] }) {
  if (staff.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-10 text-center">
        <UserCog className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Aucun membre du personnel enregistré.</p>
        <Link href="/admin/staff" className="mt-1 inline-block text-sm font-medium text-accent">
          Ajouter un membre du personnel
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead className="text-center">Versements encaissés</TableHead>
              <TableHead className="text-center">Inscriptions traitées</TableHead>
              <TableHead className="text-right">Dernière connexion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.user_id}>
                <TableCell className="font-medium">
                  {s.last_name} {s.first_name}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.position ?? "—"}</TableCell>
                <TableCell className="text-center tabular-nums">
                  <span className="font-semibold">{s.payments_count}</span>
                  {s.payments_count > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      · {formatXof(s.payments_amount)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center font-semibold tabular-nums">
                  {s.enrollments_count}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {lastLoginLabel(s.last_login)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {staff.map((s) => (
          <div key={s.user_id} className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {s.last_name} {s.first_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.position ?? "Personnel"}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">{lastLoginLabel(s.last_login)}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground tabular-nums">
              <span>
                <span className="font-medium text-foreground">{s.payments_count}</span> versements
                {s.payments_count > 0 && ` · ${formatXof(s.payments_amount)}`}
              </span>
              <span>
                <span className="font-medium text-foreground">{s.enrollments_count}</span>{" "}
                inscriptions
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
