"use client"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  OptionSelect,
  RepeaterChoice,
} from "@/components/shared/enrollment-profile/ProfileInputs"
import type { InformationSheetRow } from "@/lib/contracts/information-sheet"
import {
  ARTISTIC_DISCIPLINES,
  LV2_OPTIONS,
  PREVIOUS_LEVELS,
  type EnrollmentProfile,
} from "@/lib/contracts/enrollment-profile"
import { cn } from "@/lib/utils"
import { rowName } from "./profile-batch"

export interface ProfileBatchViewProps {
  rows: InformationSheetRow[]
  valueOf: (row: InformationSheetRow) => EnrollmentProfile
  isChanged: (row: InformationSheetRow) => boolean
  /** Refusée par le serveur au dernier envoi : à corriger avant de renvoyer. */
  isFaulty: (row: InformationSheetRow) => boolean
  onChange: (row: InformationSheetRow, next: EnrollmentProfile) => void
  lv2Allowed: boolean
  disabled: boolean
}

/** La classe en tableau, sur grand écran : une ligne par élève, tout en ligne. */
export function ProfileBatchTable({
  rows,
  valueOf,
  isChanged,
  isFaulty,
  onChange,
  lv2Allowed,
  disabled,
}: ProfileBatchViewProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-44">Élève</TableHead>
            <TableHead className="min-w-56">Niveau antérieur</TableHead>
            <TableHead className="min-w-72">Qualité</TableHead>
            <TableHead className="min-w-36">LV2</TableHead>
            <TableHead className="min-w-40">Discipline artistique</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const value = valueOf(row)
            const name = rowName(row)
            const set = (patch: Partial<EnrollmentProfile>) => onChange(row, { ...value, ...patch })
            const id = `batch-${row.enrollment_id}`
            return (
              <TableRow
                key={row.enrollment_id}
                aria-invalid={isFaulty(row) || undefined}
                className={cn(
                  isChanged(row) && "bg-accent/5",
                  isFaulty(row) && "bg-destructive/10 ring-1 ring-inset ring-destructive/60",
                )}
              >
                <TableCell>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.matricule ?? "Sans matricule"}
                    {isChanged(row) ? " · modifié" : ""}
                  </p>
                  {isFaulty(row) ? (
                    <p className="text-xs font-semibold text-destructive">Refusé : à corriger</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <OptionSelect
                      id={`${id}-level`}
                      ariaLabel={`Niveau antérieur de ${name}`}
                      value={value.previous_level}
                      options={PREVIOUS_LEVELS}
                      onChange={(v) => set({ previous_level: v })}
                      disabled={disabled}
                    />
                    <Input
                      aria-label={`Série antérieure de ${name}`}
                      className="h-11 w-16"
                      placeholder="Série"
                      maxLength={20}
                      value={value.previous_series ?? ""}
                      disabled={disabled}
                      onChange={(e) =>
                        set({ previous_series: e.target.value.trim() ? e.target.value : null })
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <RepeaterChoice
                    compact
                    label={`Qualité de ${name}`}
                    value={value.is_repeater}
                    onChange={(v) => set({ is_repeater: v })}
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <OptionSelect
                    id={`${id}-lv2`}
                    ariaLabel={`LV2 de ${name}`}
                    value={lv2Allowed ? value.lv2 : null}
                    options={LV2_OPTIONS}
                    onChange={(v) => set({ lv2: v })}
                    disabled={disabled || !lv2Allowed}
                    emptyLabel={lv2Allowed ? "Non renseigné" : "Non concerné"}
                  />
                </TableCell>
                <TableCell>
                  <OptionSelect
                    id={`${id}-art`}
                    ariaLabel={`Discipline artistique de ${name}`}
                    value={value.artistic_discipline}
                    options={ARTISTIC_DISCIPLINES}
                    onChange={(v) => set({ artistic_discipline: v })}
                    disabled={disabled}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
