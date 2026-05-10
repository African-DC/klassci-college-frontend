"use client"

import { useEffect, useState } from "react"
import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Loader2, X } from "lucide-react"
import { useSlugCheck } from "@/lib/hooks/super-admin/useTenants"
import type { WizardData } from "./WizardSteps"

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function StepSchool() {
  const { register, watch, formState } = useFormContext<WizardData>()
  const slug = watch("tenant_slug") ?? ""
  const debouncedSlug = useDebouncedValue(slug, 400)
  const { data: slugCheck, isFetching } = useSlugCheck(
    debouncedSlug,
    debouncedSlug.length >= 2 && !formState.errors.tenant_slug,
  )

  const showStatus = debouncedSlug.length >= 2 && !formState.errors.tenant_slug
  const isAvailable = slugCheck?.available === true

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="school_name">Nom de l'établissement *</Label>
        <Input
          id="school_name"
          placeholder="Lycée Moderne d'Abidjan"
          {...register("school_name")}
        />
        {formState.errors.school_name && (
          <p className="text-xs text-destructive">{formState.errors.school_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tenant_slug">
          Identifiant technique unique *
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            interne — base de données, API, audit
          </span>
        </Label>
        <div className="relative">
          <Input
            id="tenant_slug"
            placeholder="lycee-moderne"
            autoComplete="off"
            {...register("tenant_slug")}
          />
          {showStatus && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isAvailable ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <X className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>
        {formState.errors.tenant_slug ? (
          <p className="text-xs text-destructive">{formState.errors.tenant_slug.message}</p>
        ) : showStatus && !isFetching && slugCheck && !slugCheck.available ? (
          <p className="text-xs text-destructive">{slugCheck.reason ?? "Slug indisponible"}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            2-63 car., minuscules + chiffres + tirets. Stable, immuable après création.
          </p>
        )}
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        <p className="font-medium">Note : ce slug n'est pas une URL.</p>
        <p className="mt-1">
          Les utilisateurs de l'établissement se connectent via{" "}
          <span className="font-mono">https://college.klassci.com/login</span> avec leur
          email et mot de passe — le slug sert uniquement d'identifiant interne pour la
          base, l'API super-admin et les opérations CLI.
        </p>
      </div>
    </div>
  )
}
