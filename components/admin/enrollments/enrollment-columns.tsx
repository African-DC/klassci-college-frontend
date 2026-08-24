"use client"

import { Check } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AssignmentStatusBadge } from "@/components/shared/AssignmentStatusBadge"
import { cn } from "@/lib/utils"
import { STATUTS_VALIDABLES } from "@/lib/enrollment/selection"
import { enrollmentStatusView } from "@/lib/enrollment/status"
import type { Enrollment } from "@/lib/contracts/enrollment"

const TO_VALIDATE_STATUSES = STATUTS_VALIDABLES

function StudentInitialsAvatar({
  firstName,
  lastName,
  size = "md",
}: {
  firstName: string | null | undefined
  lastName: string | null | undefined
  size?: "sm" | "md"
}) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?"
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-8 w-8"
  return (
    <div
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10",
      )}
    >
      <span className="text-xs font-semibold text-primary">{initials}</span>
    </div>
  )
}

interface ColonnesOptions {
  selection: ReadonlySet<number>
  basculer: (id: number) => void
  toutSelectionne: boolean
  validables: Enrollment[]
  onToutSelectionner: (tout: boolean) => void
  /** Ouvre la confirmation de validation pour une ligne. */
  onValider: (enrollment: Enrollment) => void
}

/**
 * Les colonnes du journal des inscriptions.
 *
 * Sorties de la page, qui dépassait la limite de taille du projet avant même
 * d'accueillir la sélection multiple. Elles forment un bloc cohérent : ce
 * qu'une ligne montre, et rien de la pagination ni des filtres qui décident
 * quelles lignes s'affichent.
 */
export { StudentInitialsAvatar }

export function colonnesInscriptions({
  selection,
  basculer,
  toutSelectionne,
  validables,
  onToutSelectionner,
  onValider,
}: ColonnesOptions): ColumnDef<Enrollment>[] {
  return [
      {
        id: "selection",
        header: () => (
          <Checkbox
            checked={toutSelectionne}
            onCheckedChange={(v: boolean | "indeterminate") =>
              onToutSelectionner(v === true)
            }
            aria-label="Tout sélectionner"
            disabled={validables.length === 0}
          />
        ),
        cell: ({ row }) => {
          // Une inscription deja validee n'a rien a offrir au lot : la case
          // absente dit pourquoi mieux qu'une case grisee.
          if (!TO_VALIDATE_STATUSES.has(row.original.status)) return null
          return (
            <Checkbox
              checked={selection.has(row.original.id)}
              onCheckedChange={() => basculer(row.original.id)}
              onClick={(ev: React.MouseEvent) => ev.stopPropagation()}
              aria-label={`Sélectionner ${row.original.student_last_name ?? ""}`}
            />
          )
        },
      },
      {
        accessorKey: "student_id",
        header: "Élève",
        cell: ({ row }) => {
          const e = row.original
          return (
            <div className="flex items-center gap-3">
              <StudentInitialsAvatar
                firstName={e.student_first_name}
                lastName={e.student_last_name}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {e.student_first_name} {e.student_last_name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  #{e.id} · {e.academic_year_name}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "class_id",
        header: "Classe",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs font-medium">
            {row.original.class_name ?? `#${row.original.class_id}`}
          </Badge>
        ),
      },
      {
        accessorKey: "assignment_status",
        header: "Affectation",
        cell: ({ row }) => <AssignmentStatusBadge status={row.original.assignment_status} />,
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {enrollmentStatusView(row.original.status).label}
          </Badge>
        ),
      },
      {
        id: "validate-action",
        header: "",
        cell: ({ row }) => {
          const e = row.original
          if (!TO_VALIDATE_STATUSES.has(e.status)) return null
          return (
            <Button
              type="button"
              size="sm"
              className="h-9 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={(ev) => {
                ev.stopPropagation()
                onValider(e)
              }}
            >
              <Check className="mr-1 h-4 w-4" />
              Valider
            </Button>
          )
        },
      },
  ]
}
