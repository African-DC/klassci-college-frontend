"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Banknote, Info, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataError } from "@/components/shared/DataError"
import { Skeleton } from "@/components/ui/skeleton"
import {
  usePaymentMethodSettings,
  useUpdatePaymentMethodSettings,
} from "@/lib/hooks/usePaymentMethods"
import type { PaymentMethodSettings } from "@/lib/contracts/payment-method-settings"

/** Une case cochée par profil et par moyen, indexée « roleId:method ». */
type Draft = Record<number, string[]>

function toDraft(settings: PaymentMethodSettings): Draft {
  return Object.fromEntries(settings.roles.map((r) => [r.role_id, [...r.allowed_methods]]))
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join()
}

export function PaymentMethodSection() {
  const { data: settings, isLoading, isError, refetch } = usePaymentMethodSettings()
  const update = useUpdatePaymentMethodSettings()
  const [draft, setDraft] = useState<Draft | null>(null)

  useEffect(() => {
    if (settings) setDraft(toDraft(settings))
  }, [settings])

  const dirtyRoleIds = useMemo(() => {
    if (!settings || !draft) return []
    return settings.roles
      .filter((r) => !sameSet(draft[r.role_id] ?? [], r.allowed_methods))
      .map((r) => r.role_id)
  }, [settings, draft])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <DataError
        message="Impossible de charger les moyens de paiement."
        onRetry={() => refetch()}
      />
    )
  }

  if (!settings || !draft) return null

  if (settings.roles.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Aucun profil n&apos;est autorisé à encaisser pour le moment. Attribuez
          d&apos;abord le droit d&apos;encaisser depuis Rôles &amp; permissions.
        </CardContent>
      </Card>
    )
  }

  function toggle(roleId: number, method: string, checked: boolean) {
    setDraft((prev) => {
      if (!prev) return prev
      const current = prev[roleId] ?? []
      return {
        ...prev,
        [roleId]: checked
          ? [...current, method]
          : current.filter((m) => m !== method),
      }
    })
  }

  function save() {
    if (!settings || !draft) return
    update.mutate({
      roles: dirtyRoleIds.map((roleId) => ({
        role_id: roleId,
        allowed_methods: draft[roleId] ?? [],
      })),
    })
  }

  const drawerMethods = settings.methods.filter((m) => m.requires_cash_drawer)

  return (
    <div className="space-y-6">
      {/* Ce que la configuration change, en clair */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info aria-hidden className="size-4 text-primary" />
            À quoi sert cette page
          </CardTitle>
          <CardDescription className="space-y-2 pt-1 text-sm leading-relaxed">
            <span className="block">
              Chaque profil ci-dessous peut encaisser des versements. Cochez les
              moyens de paiement que chacun a le droit de saisir. Un moyen
              décoché disparaît de son formulaire d&apos;encaissement : il ne
              pourra pas le choisir, et pas davantage l&apos;enregistrer.
            </span>
            <span className="block">
              Exemple courant : un comptable encaisse les virements, les chèques
              et le mobile money, mais ne tient pas de caisse. Décochez
              « Espèces » sur sa ligne.
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* L'avertissement qui compte */}
      {drawerMethods.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-medium">
              Autoriser {drawerMethods.map((m) => m.label).join(", ")} engage une
              journée de caisse.
            </span>{" "}
            Ce moyen implique un tiroir : la journée s&apos;ouvre au premier
            versement, doit être comptée et clôturée le soir, et l&apos;écart est
            constaté. Les autres moyens laissent une trace bancaire ou opérateur
            et n&apos;ont rien à compter.
          </p>
        </div>
      )}

      {/* Une carte par profil — plus lisible qu'un tableau sur mobile */}
      <div className="space-y-4">
        {settings.roles.map((role) => {
          const selected = draft[role.role_id] ?? []
          const isDirty = dirtyRoleIds.includes(role.role_id)
          return (
            <Card key={role.role_id} className={isDirty ? "border-primary/40" : undefined}>
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {role.role_label}
                  {isDirty && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">
                      Modifié
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {selected.length === 0
                    ? "Ne peut plus encaisser aucun versement."
                    : `Peut encaisser par ${selected.length} moyen${selected.length > 1 ? "s" : ""}.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  {settings.methods.map((method) => {
                    const inputId = `method-${role.role_id}-${method.key}`
                    const checked = selected.includes(method.key)
                    return (
                      <label
                        key={method.key}
                        htmlFor={inputId}
                        className="flex h-11 cursor-pointer items-center gap-3 rounded-md px-2 transition-colors hover:bg-muted/60"
                      >
                        <Checkbox
                          id={inputId}
                          checked={checked}
                          onCheckedChange={(v) =>
                            toggle(role.role_id, method.key, v === true)
                          }
                        />
                        <span className="flex items-center gap-1.5 text-sm">
                          {method.label}
                          {method.requires_cash_drawer && (
                            <Banknote
                              aria-label="engage une journée de caisse"
                              className="size-3.5 text-amber-600 dark:text-amber-400"
                            />
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={save}
          disabled={dirtyRoleIds.length === 0 || update.isPending}
          className="h-11"
        >
          {update.isPending ? (
            <Loader2 aria-hidden className="mr-2 size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="mr-2 size-4" />
          )}
          Enregistrer
        </Button>
        {dirtyRoleIds.length > 0 && (
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => setDraft(toDraft(settings))}
            disabled={update.isPending}
          >
            Annuler les modifications
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          {dirtyRoleIds.length === 0
            ? "Aucune modification en attente."
            : `${dirtyRoleIds.length} profil${dirtyRoleIds.length > 1 ? "s" : ""} modifié${dirtyRoleIds.length > 1 ? "s" : ""}.`}
        </p>
      </div>
    </div>
  )
}
