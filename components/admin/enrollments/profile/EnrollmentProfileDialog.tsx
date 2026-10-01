"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EnrollmentProfileFields } from "@/components/shared/enrollment-profile/EnrollmentProfileFields"
import { useProfileCorrection } from "@/components/shared/enrollment-profile/useProfileCorrection"
import type { EnrollmentProfile } from "@/lib/contracts/enrollment-profile"
import { useUpdateEnrollmentProfile } from "@/lib/hooks/useEnrollmentProfile"

interface EnrollmentProfileDialogProps {
  enrollmentId: number
  saved: EnrollmentProfile
  levelName: string | null
  open: boolean
  onClose: () => void
}

/** Corriger les renseignements de la fiche, sans rouvrir toute l'inscription. */
export function EnrollmentProfileDialog({
  enrollmentId,
  saved,
  levelName,
  open,
  onClose,
}: EnrollmentProfileDialogProps) {
  const correction = useProfileCorrection(saved)
  const update = useUpdateEnrollmentProfile()
  const changes = correction.changes
  const nothingChanged = Object.keys(changes).length === 0

  function close() {
    correction.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : close())}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Renseignements de la fiche</DialogTitle>
        </DialogHeader>
        <EnrollmentProfileFields
          idPrefix={`enrollment-profile-${enrollmentId}`}
          value={correction.value}
          onChange={correction.onChange}
          qualityHint={correction.qualityHint}
          levelName={levelName}
          disabled={update.isPending}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-11" onClick={close}>
            Annuler
          </Button>
          <Button
            type="button"
            className="h-11"
            disabled={nothingChanged || update.isPending}
            onClick={() => update.mutate({ enrollmentId, changes }, { onSuccess: onClose })}
          >
            {update.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
