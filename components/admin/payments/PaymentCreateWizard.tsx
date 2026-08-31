"use client"

import { useState } from "react"
import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StudentPicker } from "@/components/shared/StudentPicker"
import { StepSelectEnrollment } from "@/components/admin/payments/wizard/StepSelectEnrollment"
import { StepRecordPayment } from "@/components/admin/payments/wizard/StepRecordPayment"
import { cn } from "@/lib/utils"
import type { Student } from "@/lib/contracts/student"
import type { Enrollment } from "@/lib/contracts/enrollment"

type StepNumber = 1 | 2 | 3

interface WizardState {
  step: StepNumber
  student: Student | null
  enrollment: Enrollment | null
}

/**
 * Trois étapes, plus quatre.
 *
 * L'ancienne étape « Choisir le frais » forçait un versement à ne viser qu'un
 * frais. Le guichet ne fonctionne pas ainsi : une famille pose une somme, et
 * c'est l'encaisseur qui décide, ou pas, de la découper. Le choix des frais
 * a donc rejoint l'étape de saisie, où il est facultatif.
 */
const STEP_LABELS = [
  "Rechercher un élève",
  "Choisir l'inscription",
  "Saisir le versement",
] as const

const INITIAL: WizardState = { step: 1, student: null, enrollment: null }

interface PaymentCreateWizardProps {
  open: boolean
  onClose: () => void
}

export function PaymentCreateWizard({ open, onClose }: PaymentCreateWizardProps) {
  const [wizard, setWizard] = useState<WizardState>(INITIAL)

  function handleClose() {
    setWizard(INITIAL)
    onClose()
  }

  function goBack() {
    setWizard((prev) => {
      if (prev.step === 2) return { ...prev, step: 1, student: null }
      if (prev.step === 3) return { ...prev, step: 2, enrollment: null }
      return prev
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/*
        Pas de `max-h` ici : `DialogContent` en pose déjà un, en `dvh`, avec le
        défilement interne qui va avec. Le `85vh` qu'on surchargeait se mesure
        barre d'adresse masquée, donc trop haut sur un téléphone, et gagnait
        sur celui de la primitive.

        Ni `vh` ni `dvh` ne rétrécit à l'ouverture du clavier : cela demande
        `interactive-widget=resizes-content` dans le meta viewport, que
        l'application ne déclare pas. Garder le compteur de répartition visible
        clavier ouvert reste donc à faire, et cela se joue dans `app/layout.tsx`,
        pas ici.
      */}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
        </DialogHeader>

        <StepProgress currentStep={wizard.step} />

        {wizard.step > 1 && (
          <Button
            variant="ghost"
            onClick={goBack}
            className="h-11 w-fit gap-2 px-2 sm:h-9"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour
          </Button>
        )}

        {wizard.step === 1 && (
          <StudentPicker
            autoFocus
            onSelect={(student) => setWizard({ step: 2, student, enrollment: null })}
          />
        )}

        {wizard.step === 2 && wizard.student && (
          <StepSelectEnrollment
            student={wizard.student}
            onSelect={(enrollment) =>
              setWizard((prev) => ({ ...prev, step: 3, enrollment }))
            }
          />
        )}

        {wizard.step === 3 && wizard.student && wizard.enrollment && (
          <StepRecordPayment
            student={wizard.student}
            enrollment={wizard.enrollment}
            onSuccess={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function StepProgress({ currentStep }: { currentStep: StepNumber }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="shrink-0 text-muted-foreground">
          Étape {currentStep} sur {STEP_LABELS.length}
        </span>
        <span className="truncate font-medium">{STEP_LABELS[currentStep - 1]}</span>
      </div>
      <Progress
        value={(currentStep / STEP_LABELS.length) * 100}
        className="h-2"
        aria-label={`Étape ${currentStep} sur ${STEP_LABELS.length}`}
      />
      <ol className="flex justify-between gap-2" role="list">
        {STEP_LABELS.map((label, index) => {
          const stepNum = index + 1
          const isDone = currentStep > stepNum
          const isCurrent = currentStep === stepNum
          return (
            <li
              key={label}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-1 text-xs",
                isCurrent
                  ? "font-medium text-primary"
                  : isDone
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
              )}
            >
              {isDone ? (
                <Check className="h-3 w-3 shrink-0" aria-hidden />
              ) : (
                <span
                  aria-hidden
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]"
                >
                  {stepNum}
                </span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
