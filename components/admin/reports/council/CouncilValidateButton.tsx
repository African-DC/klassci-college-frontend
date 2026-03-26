"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useValidateCouncil } from "@/lib/hooks/useCouncil"

interface CouncilValidateButtonProps {
  minutesId: number | undefined
  disabled?: boolean
}

export function CouncilValidateButton({ minutesId, disabled }: CouncilValidateButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate, isPending } = useValidateCouncil()

  function handleValidate() {
    if (!minutesId) return
    mutate(minutesId, { onSuccess: () => setConfirmOpen(false) })
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || !minutesId}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Valider le PV
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Valider le procès-verbal</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Cette action est irréversible. Une fois validé, le procès-verbal
            ne pourra plus être modifié. Les décisions seront définitives.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleValidate} disabled={isPending}>
              {isPending ? "Validation..." : "Valider définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
