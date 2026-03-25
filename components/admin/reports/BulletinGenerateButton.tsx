"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useGenerateBulletins } from "@/lib/hooks/useBulletins"
import type { Trimester } from "@/lib/contracts/bulletin"

interface BulletinGenerateButtonProps {
  classId: number | undefined
  trimester: Trimester | undefined
  academicYearId: number | undefined
  className?: string
}

const trimesterLabels: Record<string, string> = {
  "1": "1er trimestre",
  "2": "2ème trimestre",
  "3": "3ème trimestre",
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
    if (!classId || !trimester || !academicYearId) return
    mutate(
      { class_id: classId, trimester, academic_year_id: academicYearId },
      { onSuccess: () => setConfirmOpen(false) },
    )
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
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action va générer les bulletins pour le{" "}
            <strong>{trimester ? trimesterLabels[trimester] : ""}</strong>.
            Les bulletins existants en brouillon seront recalculés.
          </p>
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
