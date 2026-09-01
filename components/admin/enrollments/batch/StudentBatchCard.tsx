"use client"

import { Check, Loader2, Package, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewStudentChoiceGroup } from "@/components/forms/NewStudentChoiceGroup"
import { estDepose, type InKindRosterRow } from "@/lib/contracts/in-kind-roster"
import { cn } from "@/lib/utils"

interface StudentBatchCardProps {
  row: InKindRosterRow
  /** L'écriture en cours sur cette ligne, pour que l'état se lise ici. */
  profilEnCours: boolean
  feeEnCours: number | null
  onProfil: (valeur: boolean | null) => void
  onDepot: (feeId: number, deposer: boolean) => void
}

/**
 * Un élève, une carte. Jamais une ligne de tableau.
 *
 * L'éducateur est debout dans une cour, sur un téléphone d'entrée de gamme, en
 * plein soleil. Un tableau à colonnes multiples y devient illisible et
 * intouchable : voir `.claude/rules/ux-target-user-reality.md`. Une carte par
 * élève, des cibles au pouce, et l'état de chaque écriture visible sur place.
 *
 * Rien n'est pré-coché. Une inscription non tranchée le reste tant que
 * l'éducateur ne se prononce pas : deviner à sa place, c'est facturer un
 * ancien élève comme un arrivant.
 */
export function StudentBatchCard({
  row,
  profilEnCours,
  feeEnCours,
  onProfil,
  onDepot,
}: StudentBatchCardProps) {
  const repondu = row.is_new_student !== null

  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-3 shadow-sm",
        repondu ? "border-border" : "border-amber-300 dark:border-amber-700/60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-semibold leading-tight">
          {row.last_name} {row.first_name}
        </p>
        {repondu ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
            <Check aria-hidden className="h-3.5 w-3.5" />
            Renseigné
          </span>
        ) : (
          <span className="shrink-0 text-xs text-amber-700 dark:text-amber-400">À renseigner</span>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Cet élève est-il nouveau dans l&apos;établissement ?
        </p>
        <NewStudentChoiceGroup
          value={row.is_new_student}
          onChange={onProfil}
          allowUndecided
          disabled={profilEnCours}
        />
      </div>

      {row.fees.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Articles déposés</p>
          <div className="space-y-2">
            {row.fees.map((fee) => {
              const depose = estDepose(fee)
              const enCours = feeEnCours === fee.fee_id
              return (
                <div
                  key={fee.fee_id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <Package aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">{fee.category_name}</span>
                  </span>
                  {depose ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={enCours}
                      onClick={() => onDepot(fee.fee_id, false)}
                      className="h-11 shrink-0 gap-1.5 px-3 text-xs sm:h-9"
                    >
                      {enCours ? (
                        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Undo2 aria-hidden className="h-3.5 w-3.5" />
                      )}
                      Annuler le dépôt
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={enCours}
                      onClick={() => onDepot(fee.fee_id, true)}
                      className="h-11 shrink-0 gap-1.5 px-3 text-xs sm:h-9"
                    >
                      {enCours ? (
                        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Marquer déposé
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </li>
  )
}
