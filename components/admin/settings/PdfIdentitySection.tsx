"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ExternalLink, Eye, Palette, Quote, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { settingsApi } from "@/lib/api/settings"
import type { SchoolSettings } from "@/lib/contracts/settings"
import { ColorField } from "./pdf-identity/ColorField"
import { LivePreview } from "./pdf-identity/LivePreview"

interface PdfIdentitySectionProps {
  settings: SchoolSettings | undefined
  isLoading: boolean
}

const DEFAULT_PRIMARY = "#0F3F8C"
const DEFAULT_ACCENT = "#F58220"

interface IdentityFormValues {
  primary_color: string
  accent_color: string
  website: string
  motto: string
}

function isValidHex(v: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(v)
}

export function PdfIdentitySection({ settings, isLoading }: PdfIdentitySectionProps) {
  const queryClient = useQueryClient()

  const initial: IdentityFormValues = useMemo(
    () => ({
      primary_color: settings?.primary_color ?? DEFAULT_PRIMARY,
      accent_color: settings?.accent_color ?? DEFAULT_ACCENT,
      website: settings?.website ?? "",
      motto: settings?.motto ?? "",
    }),
    [settings?.primary_color, settings?.accent_color, settings?.website, settings?.motto],
  )

  const [values, setValues] = useState<IdentityFormValues>(initial)
  useEffect(() => setValues(initial), [initial])

  const debouncedPrimary = useDebounce(values.primary_color, 80)
  const debouncedAccent = useDebounce(values.accent_color, 80)

  const isDirty =
    values.primary_color !== initial.primary_color ||
    values.accent_color !== initial.accent_color ||
    values.website !== initial.website ||
    values.motto !== initial.motto

  const primaryValid = isValidHex(values.primary_color)
  const accentValid = isValidHex(values.accent_color)
  const canSubmit = isDirty && primaryValid && accentValid

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      settingsApi.updateSchoolInfo({
        school_name: settings?.school_name ?? "",
        address: settings?.address ?? undefined,
        phone: settings?.phone ?? undefined,
        email: settings?.email ?? undefined,
        ministry_code: settings?.ministry_code ?? undefined,
        head_master_name: settings?.head_master_name ?? undefined,
        head_master_title: settings?.head_master_title ?? undefined,
        primary_color: values.primary_color || null,
        accent_color: values.accent_color || null,
        website: values.website || null,
        motto: values.motto || null,
      }),
    onSuccess: () => {
      toast.success("Identité visuelle enregistrée", {
        description: "Les prochains PDF utiliseront ces couleurs et cette devise.",
      })
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
    onError: (err) =>
      toast.error("Échec de l'enregistrement", { description: err.message }),
  })

  function resetToKlassci() {
    setValues((s) => ({
      ...s,
      primary_color: DEFAULT_PRIMARY,
      accent_color: DEFAULT_ACCENT,
    }))
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-6 w-64 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="pdf-identity-title"
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header editorial */}
      <header className="border-b border-border bg-gradient-to-br from-muted/40 to-background px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 ring-1 ring-primary/20">
            <Palette className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="flex-1">
            <h2
              id="pdf-identity-title"
              className="font-serif text-xl text-foreground tracking-tight"
            >
              Identité visuelle des PDF
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Personnalisez la palette, la devise et les coordonnées qui apparaissent
              sur tous les documents officiels (reçus, bulletins, attestations, fiches
              d&apos;inscription).
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1fr_360px]">
        {/* Form column */}
        <div className="space-y-6">
          {/* Couleurs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Palette
              </Label>
              {(values.primary_color !== DEFAULT_PRIMARY ||
                values.accent_color !== DEFAULT_ACCENT) && (
                <button
                  type="button"
                  onClick={resetToKlassci}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Palette KLASSCI par défaut
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField
                label="Couleur principale"
                hint="Titres, bordures, accents structurels"
                value={values.primary_color}
                isValid={primaryValid}
                onChange={(v) => setValues((s) => ({ ...s, primary_color: v }))}
              />
              <ColorField
                label="Couleur d'accent"
                hint="Devise, totaux, mises en valeur"
                value={values.accent_color}
                isValid={accentValid}
                onChange={(v) => setValues((s) => ({ ...s, accent_color: v }))}
              />
            </div>
          </div>

          {/* Devise + Site web */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label
                htmlFor="motto"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Devise de l&apos;établissement
              </Label>
              <div className="relative mt-2">
                <Quote
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60"
                  aria-hidden
                />
                <Input
                  id="motto"
                  value={values.motto}
                  onChange={(e) =>
                    setValues((s) => ({ ...s, motto: e.target.value.slice(0, 255) }))
                  }
                  placeholder="Ex : Excellence, Discipline, Travail"
                  className="h-11 pl-9 font-serif italic"
                  maxLength={255}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Apparaît en italique sous le nom de l&apos;école dans les PDF.
              </p>
            </div>
            <div>
              <Label
                htmlFor="website"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Site web
              </Label>
              <div className="relative mt-2">
                <ExternalLink
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60"
                  aria-hidden
                />
                <Input
                  id="website"
                  type="url"
                  inputMode="url"
                  value={values.website}
                  onChange={(e) =>
                    setValues((s) => ({ ...s, website: e.target.value.slice(0, 255) }))
                  }
                  placeholder="https://lycee-saint-aug.ci"
                  className="h-11 pl-9"
                  maxLength={255}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Affiché en pied de page des documents officiels.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-dashed border-border">
            <Button
              type="button"
              onClick={() => mutate()}
              disabled={!canSubmit || isPending}
              className="h-11 sm:h-10"
            >
              {isPending ? "Enregistrement…" : "Enregistrer l'identité"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 sm:h-10"
              onClick={() => {
                window.open(
                  `${process.env.NEXT_PUBLIC_API_URL}/payments/daily-cash-book?date=${new Date()
                    .toISOString()
                    .slice(0, 10)}`,
                  "_blank",
                )
              }}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Aperçu PDF (bordereau du jour)
            </Button>
            {!primaryValid && (
              <span className="text-xs text-rose-600">Couleur principale invalide</span>
            )}
            {!accentValid && (
              <span className="text-xs text-rose-600">Couleur d&apos;accent invalide</span>
            )}
          </div>
        </div>

        {/* Live preview column */}
        <LivePreview
          schoolName={settings?.school_name ?? "Mon Établissement"}
          ministryCode={settings?.ministry_code ?? null}
          motto={values.motto}
          website={values.website}
          primary={primaryValid ? debouncedPrimary : DEFAULT_PRIMARY}
          accent={accentValid ? debouncedAccent : DEFAULT_ACCENT}
          logoUrl={settings?.logo_url ?? null}
        />
      </div>
    </section>
  )
}
