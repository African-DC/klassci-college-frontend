"use client"

import { EnrollmentProfileFields } from "@/components/shared/enrollment-profile/EnrollmentProfileFields"
import type { ProfileBatchViewProps } from "./ProfileBatchTable"
import { cn } from "@/lib/utils"
import { rowName } from "./profile-batch"

/**
 * La classe en cartes, sur téléphone : un élève par carte, les champs l'un
 * sous l'autre, cibles au pouce. Le même bloc que la fiche inscription.
 */
export function ProfileBatchCards({
  rows,
  valueOf,
  isChanged,
  isFaulty,
  qualityHintOf,
  onChange,
  disabled,
  levelName,
}: Omit<ProfileBatchViewProps, "lv2Allowed"> & { levelName: string | null }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.enrollment_id}
          className={cn("space-y-1", isFaulty(row) && "rounded-lg ring-2 ring-destructive/60")}
        >
          <p className="px-1 text-xs text-muted-foreground">
            {row.matricule ?? "Sans matricule"}
            {isChanged(row) ? " · modifié, à enregistrer" : ""}
          </p>
          {isFaulty(row) ? (
            <p role="alert" className="px-1 text-xs font-semibold text-destructive">
              Refusé : à corriger
            </p>
          ) : null}
          <EnrollmentProfileFields
            idPrefix={`batch-card-${row.enrollment_id}`}
            studentName={rowName(row)}
            value={valueOf(row)}
            onChange={(next, field) => onChange(row, next, field)}
            qualityHint={qualityHintOf(row)}
            levelName={levelName}
            disabled={disabled}
          />
        </li>
      ))}
    </ul>
  )
}
