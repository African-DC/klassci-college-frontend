"use client"

import { EnrollmentProfileFields } from "@/components/shared/enrollment-profile/EnrollmentProfileFields"
import type { ProfileBatchViewProps } from "./ProfileBatchTable"
import { rowName } from "./profile-batch"

/**
 * La classe en cartes, sur téléphone : un élève par carte, les champs l'un
 * sous l'autre, cibles au pouce. Le même bloc que la fiche inscription.
 */
export function ProfileBatchCards({
  rows,
  valueOf,
  isChanged,
  onChange,
  disabled,
  levelName,
}: Omit<ProfileBatchViewProps, "lv2Allowed"> & { levelName: string | null }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.enrollment_id} className="space-y-1">
          <p className="px-1 text-xs text-muted-foreground">
            {row.matricule ?? "Sans matricule"}
            {isChanged(row) ? " · modifié, à enregistrer" : ""}
          </p>
          <EnrollmentProfileFields
            idPrefix={`batch-card-${row.enrollment_id}`}
            studentName={rowName(row)}
            value={valueOf(row)}
            onChange={(next) => onChange(row, next)}
            levelName={levelName}
            disabled={disabled}
          />
        </li>
      ))}
    </ul>
  )
}
