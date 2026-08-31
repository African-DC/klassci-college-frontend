"use client"

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Sentinelle du choix « tous les élèves ».
 *
 * Le contrat envoie `null` au serveur, mais Radix refuse la chaîne vide comme
 * valeur d'option : il faut un jeton pour représenter l'absence de restriction.
 */
const TOUS = "tous"

export interface FeeAudienceOption<T extends string> {
  value: T | null
  label: string
  hint: string
}

interface FeeAudienceSelectProps<T extends string> {
  label: string
  options: readonly FeeAudienceOption<T>[]
  value: T | null | undefined
  onChange: (value: T | null) => void
}

/**
 * Une dimension de ciblage d'un tarif : portée d'affectation, profil
 * d'inscription, et ce que l'école ajoutera demain.
 *
 * Elles se posent toutes pareil, et c'est voulu : trois choix dont « Tous les
 * élèves » par défaut, pour que les grilles déjà configurées ne bougent pas, et
 * une phrase sous le champ qui dit ce que le choix change sur la facture d'une
 * famille. Une dimension qui restreint un tarif ne le rend pas moins cher pour
 * les autres, elle le leur retire ; ça ne se devine pas, ça s'écrit.
 */
export function FeeAudienceSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: FeeAudienceSelectProps<T>) {
  const courant = value ?? null

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Select
        value={courant ?? TOUS}
        onValueChange={(v) => onChange(v === TOUS ? null : (v as T))}
      >
        <FormControl>
          <SelectTrigger className="h-11 sm:h-10">
            <SelectValue />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value ?? TOUS}
              value={option.value ?? TOUS}
              className="min-h-11 sm:min-h-9"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* `FormDescription` et pas un simple paragraphe : la phrase est
          rattachée au champ, donc lue par une synthèse vocale au moment où on
          ouvre la liste, pas seulement visible pour qui regarde l'écran. */}
      <FormDescription className="text-xs">
        {options.find((option) => option.value === courant)?.hint}
      </FormDescription>
      <FormMessage />
    </FormItem>
  )
}
