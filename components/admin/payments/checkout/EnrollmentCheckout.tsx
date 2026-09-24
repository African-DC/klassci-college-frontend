"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StepRecordPayment } from "@/components/admin/payments/wizard/StepRecordPayment"
import { usePermissions } from "@/lib/hooks/usePermissions"
import type { Payment } from "@/lib/contracts/payment"
import { PaymentSuccessPanel } from "./PaymentSuccessPanel"

export interface CheckoutTarget {
  enrollmentId: number
  studentName: string
  /** « 6e B · 2025-2026 » */
  contexte: string
}

interface EnrollmentCheckoutProps extends CheckoutTarget {
  onDone: () => void
  /** Libellé du bouton qui remet l'encaissement à plus tard ; absent, il n'y en a pas. */
  laterLabel?: string
}

/**
 * Encaisser une inscription précise, puis remettre le reçu.
 *
 * Le même parcours sert partout où l'on sait déjà de quelle inscription il
 * s'agit : juste après l'avoir créée, depuis la liste, depuis la fiche, depuis
 * le lien d'une notification. L'encaisseur ne recherche plus l'élève qu'il a
 * sous les yeux, et ne choisit plus une inscription qu'on vient de lui donner.
 *
 * Qui n'a pas le droit d'encaisser ne voit pas de formulaire voué au refus :
 * le dossier part à la caisse, et il le sait.
 */
export function EnrollmentCheckout({
  enrollmentId,
  studentName,
  contexte,
  onDone,
  laterLabel,
}: EnrollmentCheckoutProps) {
  const { has, isLoading } = usePermissions()
  const [fait, setFait] = useState<Payment | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!has("payments:create")) {
    return <HandedToCashier studentName={studentName} onDone={onDone} />
  }

  if (fait) {
    return (
      <PaymentSuccessPanel payment={fait} studentName={studentName} onDone={onDone} />
    )
  }

  return (
    <div className="space-y-3">
      <StepRecordPayment
        enrollmentId={enrollmentId}
        studentName={studentName}
        contexte={contexte}
        onSuccess={setFait}
      />
      {laterLabel ? (
        <Button type="button" variant="ghost" onClick={onDone} className="h-11 w-full">
          {laterLabel}
        </Button>
      ) : null}
    </div>
  )
}

function HandedToCashier({ studentName, onDone }: { studentName: string; onDone: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
        <Send className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-medium">Dossier transmis à la caisse</p>
          <p className="text-muted-foreground">
            Les personnes qui encaissent ont été prévenues pour {studentName}. Vous serez averti(e)
            dès que le premier versement sera enregistré, avec son montant.
          </p>
        </div>
      </div>
      <Button type="button" onClick={onDone} className="h-11 w-full">
        Terminer
      </Button>
    </div>
  )
}
