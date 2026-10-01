"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/shared/enrollment-profile/ProfileInputs"
import {
  SCHOLARSHIP_KINDS,
  type Scholarship,
  type ScholarshipKind,
} from "@/lib/contracts/enrollment-profile"
import { useSetScholarship } from "@/lib/hooks/useEnrollmentProfile"

interface ScholarshipDialogProps {
  enrollmentId: number
  current: Scholarship | null
  open: boolean
  onClose: () => void
}

/** Déclarer ou corriger une bourse : la nature est obligatoire, le reste aide. */
export function ScholarshipDialog({ enrollmentId, current, open, onClose }: ScholarshipDialogProps) {
  const [kind, setKind] = useState<ScholarshipKind | null>(current?.kind ?? null)
  const [provider, setProvider] = useState(current?.provider ?? "")
  const [decision, setDecision] = useState(current?.decision_number ?? "")
  const save = useSetScholarship(enrollmentId)

  function submit() {
    if (!kind) return
    save.mutate(
      {
        kind,
        provider: provider.trim() || null,
        decision_number: decision.trim() || null,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{current ? "Modifier la bourse" : "Déclarer une bourse"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="scholarship-kind">Nature de la bourse *</Label>
            <OptionSelect
              id="scholarship-kind"
              value={kind}
              options={SCHOLARSHIP_KINDS}
              onChange={setKind}
              emptyLabel="Choisir"
              disabled={save.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scholarship-provider">Organisme</Label>
            <Input
              id="scholarship-provider"
              className="h-11"
              placeholder="Ex : État de Côte d'Ivoire"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={save.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scholarship-decision">N° de décision</Label>
            <Input
              id="scholarship-decision"
              className="h-11"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              disabled={save.isPending}
            />
          </div>
          {!kind ? (
            <p className="text-xs text-muted-foreground">
              Choisissez la nature de la bourse pour pouvoir enregistrer.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-11" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            className="h-11"
            disabled={!kind || save.isPending}
            onClick={submit}
          >
            {save.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
