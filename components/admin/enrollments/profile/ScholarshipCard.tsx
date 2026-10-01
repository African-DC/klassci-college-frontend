"use client"

import { useState } from "react"
import { Award, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import type { Enrollment } from "@/lib/contracts/enrollment"
import { SCHOLARSHIP_KINDS, optionLabel } from "@/lib/contracts/enrollment-profile"
import { useRemoveScholarship } from "@/lib/hooks/useEnrollmentProfile"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { ScholarshipDialog } from "./ScholarshipDialog"

interface ScholarshipCardProps {
  enrollment: Enrollment
  studentName: string
}

/**
 * La bourse de l'élève : c'est elle qui fait « Boursier » sur la fiche.
 *
 * Déclarer ou retirer une bourse est réservé à `scholarships:manage` : le
 * serveur le vérifie, l'écran se contente de ne pas montrer une porte close.
 */
export function ScholarshipCard({ enrollment, studentName }: ScholarshipCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const { has } = usePermissions()
  const remove = useRemoveScholarship(enrollment.id)
  const canManage = has("scholarships:manage")
  const bourse = enrollment.scholarship ?? null

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Award className="h-4 w-4" aria-hidden />
            Bourse
          </h3>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-10"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" aria-hidden />
                {bourse ? "Modifier" : "Déclarer une bourse"}
              </Button>
              {bourse ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 text-destructive hover:text-destructive sm:h-10"
                  onClick={() => setRemoveOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                  Retirer la bourse
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {bourse ? (
          <div className="space-y-2">
            <Badge variant="secondary">Boursier · {optionLabel(SCHOLARSHIP_KINDS, bourse.kind)}</Badge>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Organisme</dt>
                <dd className="font-medium">{bourse.provider || "Non renseigné"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">N° de décision</dt>
                <dd className="font-medium tabular-nums">
                  {bourse.decision_number || "Non renseigné"}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="space-y-1">
            <Badge variant="outline">Non boursier</Badge>
            <p className="text-xs text-muted-foreground">
              Aucune bourse déclarée pour cette inscription.
            </p>
          </div>
        )}
      </CardContent>

      {editOpen ? (
        <ScholarshipDialog
          enrollmentId={enrollment.id}
          current={bourse}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      ) : null}

      <ConfirmActionDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Retirer la bourse ?"
        description={`${studentName} apparaîtra « Non boursier » sur la fiche de renseignements.`}
        confirmLabel="Retirer la bourse"
        pendingLabel="Retrait..."
        pending={remove.isPending}
        tone="warning"
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => setRemoveOpen(false) })}
      />
    </Card>
  )
}
