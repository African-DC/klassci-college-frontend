"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataError } from "@/components/shared/DataError"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ARREARS_POLICY_CHOICES, type ArrearsPolicyValue } from "@/lib/contracts/arrears-policy"
import { useArrearsPolicy, useUpdateArrearsPolicy } from "@/lib/hooks/useArrearsPolicy"

/**
 * Le droit qui ouvre cet écran : « je fixe les règles d'argent de cette école ».
 *
 * C'est un droit, jamais un rôle : une école qui confie la caisse à son
 * économe doit pouvoir lui ouvrir ce réglage sans qu'on touche au code.
 */
export const ARREARS_POLICY_PERMISSION = "admin:fee-categories:update"

/** La colonne est un entier non signé côté serveur ; au-delà, il répond 422. */
const SEUIL_MAX_XOF = 4_294_967_295

/**
 * Ce que l'établissement décide de faire d'une dette d'un exercice précédent.
 *
 * Trois choix et un seuil, énoncés d'un coup : le serveur attend la politique
 * entière, et un envoi partiel sortirait en erreur plutôt qu'en réglage à
 * moitié écrit.
 *
 * Chaque choix dit ce qu'il fait au guichet demain matin, au présent et sans
 * jargon. « Ignorer » est le défaut et ne change rien : une école qui n'ouvre
 * jamais cet écran ne voit aucune différence.
 */
export function ArrearsPolicySection() {
  const { data: reglage, isLoading, isError, refetch } = useArrearsPolicy()
  const { mutate, isPending } = useUpdateArrearsPolicy()

  const [politique, setPolitique] = useState<ArrearsPolicyValue>("off")
  const [seuil, setSeuil] = useState("0")

  useEffect(() => {
    if (!reglage) return
    setPolitique(reglage.arrears_policy)
    setSeuil(String(reglage.arrears_block_threshold_xof))
  }, [reglage])

  if (isLoading) return <Skeleton className="h-72 w-full" />

  if (isError) {
    return (
      <DataError
        message="Impossible de charger la règle sur les dettes des années précédentes."
        onRetry={() => refetch()}
      />
    )
  }

  if (!reglage) return null

  const seuilNombre = Number(seuil)
  // Un champ vidé ne vaut pas zéro : `Number("")` rend `0`, et enregistrer sur
  // cette lecture remplacerait par un blocage au premier franc le seuil que la
  // direction avait fixé, sans qu'elle ait rien tapé.
  const seuilValide =
    seuil.trim() !== "" &&
    Number.isInteger(seuilNombre) &&
    seuilNombre >= 0 &&
    seuilNombre <= SEUIL_MAX_XOF
  const modifie =
    politique !== reglage.arrears_policy ||
    (seuilValide && seuilNombre !== reglage.arrears_block_threshold_xof)

  function enregistrer() {
    if (!seuilValide) return
    mutate({ arrears_policy: politique, arrears_block_threshold_xof: seuilNombre })
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale aria-hidden className="h-4 w-4 text-muted-foreground" />
          Dettes des années précédentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Quand une famille se réinscrit alors qu&apos;il reste des frais dus au titre des années
          précédentes, voici ce que fait le logiciel au moment de la réinscription.
        </p>

        <div
          role="radiogroup"
          aria-label="Règle appliquée à la réinscription"
          className="space-y-2"
        >
          {ARREARS_POLICY_CHOICES.map((choix) => {
            const retenu = politique === choix.value
            return (
              <button
                key={choix.value}
                type="button"
                role="radio"
                aria-checked={retenu}
                disabled={isPending}
                onClick={() => setPolitique(choix.value)}
                className={cn(
                  "flex min-h-11 w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  retenu
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    retenu
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {retenu ? <Check aria-hidden className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="min-w-0 break-words">
                  <span className={cn("block text-sm text-foreground", retenu && "font-semibold")}>
                    {choix.label}
                    {choix.value === "off" ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (par défaut)
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{choix.effect}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/40 p-4">
          <Label htmlFor="arrears-threshold">Seuil de blocage (FCFA)</Label>
          <Input
            id="arrears-threshold"
            type="number"
            inputMode="numeric"
            min={0}
            max={SEUIL_MAX_XOF}
            step={1}
            value={seuil}
            disabled={isPending}
            onChange={(event) => setSeuil(event.target.value)}
            aria-describedby="arrears-threshold-aide"
            className="h-11 sm:h-10"
          />
          <p id="arrears-threshold-aide" className="text-xs text-muted-foreground">
            La réinscription est refusée quand la dette dépasse ce montant. À 0, elle est refusée
            dès le premier franc dû. Ce seuil ne sert qu&apos;au choix « Bloquer », et il vous reste
            acquis si vous changez d&apos;avis.
          </p>
          {!seuilValide ? (
            <p role="alert" className="text-xs text-destructive">
              Indiquez un montant entier, à partir de 0.
            </p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={enregistrer}
            disabled={!modifie || !seuilValide || isPending}
            className="h-11 sm:h-10"
          >
            {isPending ? <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
