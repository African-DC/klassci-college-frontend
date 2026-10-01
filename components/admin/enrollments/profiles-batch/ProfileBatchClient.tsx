"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ClipboardCheck, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ClassSelect } from "@/components/shared/ClassSelect"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { DataError } from "@/components/shared/DataError"
import {
  lv2AllowedForLevel,
  profileChanges,
  profileOf,
  type EnrollmentProfile,
} from "@/lib/contracts/enrollment-profile"
import type { InformationSheetRow } from "@/lib/contracts/information-sheet"
import { useClassChoice } from "@/lib/hooks/useClassChoice"
import { useBatchUpdateEnrollmentProfiles } from "@/lib/hooks/useEnrollmentProfile"
import { useClassInformationSheet } from "@/lib/hooks/useInformationSheet"
import { describeBatchFailure } from "@/lib/enrollment/profile-batch-errors"
import { changedItems, rowName, rowProfile, type ProfileDrafts } from "./profile-batch"
import { ProfileBatchCards } from "./ProfileBatchCards"
import { ProfileBatchTable } from "./ProfileBatchTable"

/**
 * Saisie des renseignements de la fiche, une classe à la fois.
 *
 * La comptabilité a besoin, pour chaque élève, du niveau antérieur, de la
 * qualité, de la LV2 et de la discipline artistique. Fiche par fiche, quarante
 * élèves ne se font pas ; ici la classe tient sur un écran et part en un envoi.
 *
 * **Un seul envoi, tout ou rien.** Seules les lignes modifiées partent. Si le
 * serveur en refuse une, rien n'est enregistré et les saisies restent à
 * l'écran : on corrige et on renvoie, sans rien retaper.
 */
export function ProfileBatchClient() {
  const params = useSearchParams()
  const fromLink = Number(params.get("class"))
  const choice = useClassChoice(Number.isFinite(fromLink) && fromLink > 0 ? fromLink : undefined)
  const { data, isLoading, isError, refetch } = useClassInformationSheet(choice.classId)
  const classe = data?.classes[0]
  const rows = classe?.rows ?? []
  const nameOf = (id: number) => {
    const row = rows.find((r) => r.enrollment_id === id)
    return row ? rowName(row) : `l'inscription ${id}`
  }
  const save = useBatchUpdateEnrollmentProfiles(nameOf)
  const [drafts, setDrafts] = useState<ProfileDrafts>({})
  const [pendingClass, setPendingClass] = useState<number | null>(null)
  // Les lignes que le serveur a refusées, surlignées jusqu'au prochain envoi.
  const faulty = new Set(save.error ? describeBatchFailure(save.error, nameOf).faultyIds : [])
  const levelName = classe?.level_name ?? null
  const items = changedItems(rows, drafts)
  const dirty = items.length > 0

  function changeClass(id: number) {
    if (dirty) return setPendingClass(id)
    setDrafts({})
    save.reset()
    choice.setClassId(id)
  }

  const viewProps = {
    rows,
    valueOf: (row: InformationSheetRow) => rowProfile(row, drafts),
    isChanged: (row: InformationSheetRow) =>
      Object.keys(profileChanges(profileOf(row), rowProfile(row, drafts))).length > 0,
    onChange: (row: InformationSheetRow, next: EnrollmentProfile) =>
      setDrafts((prev) => ({ ...prev, [row.enrollment_id]: next })),
    isFaulty: (row: InformationSheetRow) => faulty.has(row.enrollment_id),
    disabled: save.isPending,
  }

  return (
    <div className="space-y-4 p-4 pb-28 md:p-6 md:pb-28">
      <div className="flex items-start gap-2.5">
        <ClipboardCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight">Saisie des renseignements</h1>
          <p className="text-sm text-muted-foreground">
            Niveau antérieur, qualité, LV2 et discipline artistique de chaque élève. Ce qui reste
            vide sortira vide sur la fiche de renseignements.
          </p>
        </div>
      </div>

      <ClassSelect
        id="classe-renseignements"
        classes={choice.classes}
        value={choice.classId}
        onChange={changeClass}
        isLoading={choice.isLoading}
        isError={choice.isError}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <DataError message="Impossible de charger cette classe." onRetry={() => refetch()} />
      ) : !choice.classId ? null : rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Aucun élève inscrit dans cette classe pour l&apos;année en cours.
        </p>
      ) : (
        <>
          <div className="hidden md:block">
            <ProfileBatchTable {...viewProps} lv2Allowed={lv2AllowedForLevel(levelName)} />
          </div>
          <div className="md:hidden">
            <ProfileBatchCards {...viewProps} levelName={levelName} />
          </div>
        </>
      )}

      {rows.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:left-auto md:right-6 md:bottom-6 md:rounded-xl md:border">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {dirty
                ? `${items.length} élève${items.length > 1 ? "s" : ""} modifié${items.length > 1 ? "s" : ""}`
                : "Aucune modification"}
            </p>
            <Button
              type="button"
              className="h-11 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!dirty || save.isPending}
              onClick={() => save.mutate(items, { onSuccess: () => setDrafts({}) })}
            >
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {save.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={pendingClass !== null}
        onOpenChange={(open) => (open ? undefined : setPendingClass(null))}
        title="Changer de classe sans enregistrer ?"
        description={`Les modifications de ${items.length} élève${items.length > 1 ? "s" : ""} seront perdues.`}
        confirmLabel="Changer sans enregistrer"
        pendingLabel="Changement..."
        cancelLabel="Rester sur cette classe"
        tone="warning"
        onConfirm={() => {
          if (pendingClass !== null) choice.setClassId(pendingClass)
          setDrafts({})
          save.reset()
          setPendingClass(null)
        }}
      />
    </div>
  )
}
