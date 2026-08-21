"use client"

import { useEffect } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMyPaymentMethods } from "@/lib/hooks/usePaymentMethods"

interface PaymentMethodSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /** Passe l'id au déclencheur pour qu'un `<label htmlFor>` le désigne. */
  id?: string
}

/**
 * Sélecteur du moyen d'encaissement, rempli par le serveur.
 *
 * Il n'affiche que ce que la personne connectée peut réellement saisir : le
 * croisement de ce que l'école accepte et de ce que son profil autorise. Une
 * liste figée côté écran proposerait des choix refusés à l'enregistrement, et
 * la caissière recommencerait sa saisie devant la famille.
 *
 * Si le moyen actuellement sélectionné n'est pas autorisé — typiquement la
 * valeur par défaut « Espèces » d'un formulaire ouvert par un comptable qui ne
 * touche pas d'espèces — la sélection bascule sur le premier moyen disponible.
 * Sans cela, le formulaire enverrait un moyen que l'écran n'a jamais proposé.
 */
export function PaymentMethodSelect({
  value,
  onChange,
  disabled,
  id,
}: PaymentMethodSelectProps) {
  const { data: methods, isLoading, isError } = useMyPaymentMethods()

  const keys = methods?.map((m) => m.key) ?? []
  const currentIsAllowed = keys.includes(value as (typeof keys)[number])

  useEffect(() => {
    if (isLoading || keys.length === 0 || currentIsAllowed) return
    onChange(keys[0])
    // `onChange` change d'identité à chaque rendu du parent ; le déclencheur
    // utile est la liste et la validité du choix courant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, currentIsAllowed, keys.join(",")])

  if (isLoading) {
    // Volontairement PAS un `<Select>` sans valeur : React reconcilierait le
    // meme element une fois la liste chargee et passerait d'un champ non
    // controle a un champ controle, ce qu'il signale a juste titre.
    return (
      <div
        id={id}
        aria-busy="true"
        className="flex h-11 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
      >
        <Loader2 aria-hidden className="size-4 animate-spin" />
        Chargement des moyens…
      </div>
    )
  }

  if (isError) {
    return (
      <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Impossible de charger les moyens de paiement. Rechargez la page avant
          d&apos;encaisser.
        </span>
      </p>
    )
  }

  if (keys.length === 0) {
    return (
      <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Aucun moyen de paiement ne vous est autorisé. La direction peut en
          activer depuis Paramètres, onglet Moyens de paiement.
        </span>
      </p>
    )
  }

  return (
    <Select
      value={currentIsAllowed ? value : keys[0]}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-11" id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {methods?.map((method) => (
          <SelectItem key={method.key} value={method.key} className="h-11">
            {method.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
