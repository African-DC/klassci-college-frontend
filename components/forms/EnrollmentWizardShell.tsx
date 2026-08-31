"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface WizardStep {
  id: string
  label: string
  icon: LucideIcon
}

interface EnrollmentWizardShellProps {
  steps: readonly WizardStep[]
  step: number
  /** On revient sur une étape déjà vue, jamais on ne saute par-dessus. */
  maxReachedStep: number
  canNavigate: boolean
  onStepChange: (step: number) => void
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  nextDisabled: boolean
  pending: boolean
  submitLabel: string
  children: ReactNode
}

/**
 * Le cadre du formulaire d'inscription : le fil des étapes en haut, les deux
 * boutons de navigation en bas, le contenu au milieu.
 *
 * Les boutons restent en `h-11` : ce sont les deux cibles que la secrétaire
 * touche à chaque dossier, au pouce, sur un téléphone d'entrée de gamme.
 */
export function EnrollmentWizardShell({
  steps,
  step,
  maxReachedStep,
  canNavigate,
  onStepChange,
  onPrevious,
  onNext,
  onSubmit,
  nextDisabled,
  pending,
  submitLabel,
  children,
}: EnrollmentWizardShellProps) {
  const last = step === steps.length - 1

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={steps[step].id} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {steps.map((s, i) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              disabled={i > maxReachedStep || (i > 0 && !canNavigate)}
              onClick={() => {
                if (i <= maxReachedStep) onStepChange(i)
              }}
              className="text-xs sm:text-sm"
            >
              <s.icon className="mr-1.5 hidden h-3.5 w-3.5 sm:inline-block" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {children}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={onPrevious}
          disabled={step === 0 || pending}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Précédent
        </Button>

        {last ? (
          <Button type="button" className="h-11" onClick={onSubmit} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        ) : (
          <Button type="button" className="h-11" onClick={onNext} disabled={nextDisabled}>
            Suivant
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
