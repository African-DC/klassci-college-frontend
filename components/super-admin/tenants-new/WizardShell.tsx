"use client"

import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/shared/PageHero"
import { useCreateTenant } from "@/lib/hooks/super-admin/useTenants"
import { ProvisioningProgress } from "./ProvisioningProgress"
import { StepAdmin } from "./StepAdmin"
import { StepOptional } from "./StepOptional"
import { StepReview } from "./StepReview"
import { StepSchool } from "./StepSchool"
import { STEPS, type WizardData, wizardSchema } from "./WizardSteps"

export function WizardShell() {
  const [step, setStep] = useState(0)
  const methods = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    mode: "onTouched",
    defaultValues: {
      tenant_slug: "",
      school_name: "",
      admin_email: "",
      admin_password: "",
      school_address: "",
      school_phone: "",
      school_email: "",
      ministry_code: "",
    },
  })
  const mutation = useCreateTenant()

  async function next() {
    const fields = STEPS[step].fields as readonly (keyof WizardData)[]
    const valid = fields.length === 0 ? true : await methods.trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function onSubmit(data: WizardData) {
    const cleaned: WizardData = {
      tenant_slug: data.tenant_slug,
      school_name: data.school_name,
      admin_email: data.admin_email,
      admin_password: data.admin_password,
    }

    if (data.school_address) cleaned.school_address = data.school_address
    if (data.school_phone) cleaned.school_phone = data.school_phone
    if (data.school_email) cleaned.school_email = data.school_email
    if (data.ministry_code) cleaned.ministry_code = data.ministry_code

    mutation.mutate(cleaned)
  }

  if (mutation.isPending || mutation.isSuccess || mutation.isError) {
    return (
      <ProvisioningProgress
        status={mutation.isPending ? "pending" : mutation.isSuccess ? "success" : "error"}
        result={mutation.data ? { tenant_slug: mutation.data.tenant_slug } : undefined}
        errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
      />
    )
  }

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHero
          icon={Building2}
          title="Nouvel établissement"
          subtitle="Créer un tenant, son administrateur initial et ses paramètres de base"
        />

        <ol className="flex gap-2">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${
                i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted"
              }`}
              aria-current={i === step ? "step" : undefined}
            />
          ))}
        </ol>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Étape {step + 1} / {STEPS.length}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{STEPS[step].title}</h1>
          <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
        </div>

        <form onSubmit={methods.handleSubmit(onSubmit)} className="rounded-lg border bg-card p-4 shadow-sm sm:p-6">
          {step === 0 && <StepSchool />}
          {step === 1 && <StepAdmin />}
          {step === 2 && <StepOptional />}
          {step === 3 && <StepReview />}

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="h-11 sm:h-10"
            >
              Retour
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} className="h-11 sm:h-10">
                Suivant
              </Button>
            ) : (
              <Button type="submit" className="h-11 sm:h-10">
                Créer l'établissement
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  )
}
