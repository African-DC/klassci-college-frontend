"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useGenerateBulletins } from "@/lib/hooks/useBulletins"
import { BulletinGenerateSchema } from "@/lib/contracts/bulletin"
import { trimesterFullLabel } from "@/lib/utils/trimester"

interface BulletinGenerateButtonProps {
  classId: number | undefined
  trimester: number | undefined
  academicYearId: number | undefined
  className?: string
}

export function BulletinGenerateButton({
  classId,
  trimester,
  academicYearId,
  className,
}: BulletinGenerateButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate, isPending } = useGenerateBulletins()

  const disabled = !classId || !trimester || !academicYearId

  function handleGenerate() {
    const result = BulletinGenerateSchema.safeParse({
      class_id: classId,
      trimester,
      academic_year_id: academicYearId,
    })
    if (!result.success) return
    mutate(result.data, { onSuccess: () => setConfirmOpen(false) })
  }

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={disabled}
        className={className}
      >
        <FileText className="mr-2 h-4 w-4" />
        Générer les bulletins
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Générer les bulletins</DialogTitle>
            <DialogDescription>
              Cette action va générer les bulletins pour le{" "}
              <strong>{trimester ? trimesterFullLabel(trimester) : ""}</strong>.
              Les bulletins existants en brouillon seront recalculés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? "Génération..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
