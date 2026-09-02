"use client"

import { useMemo, useState } from "react"
import { useClasses } from "@/lib/hooks/useClasses"

/**
 * La classe sur laquelle porte un écran, et la liste où la choisir.
 *
 * Deux écrans travaillent classe par classe — la saisie en lot et les soldes —
 * et chacun refaisait le même geste : charger les classes, les trier par nom,
 * et retomber sur la première tant que rien n'est choisi. Trois copies d'une
 * même règle, dont le tri : deux écrans qui listeraient la même école dans
 * deux ordres différents, c'est un éducateur qui cherche sa 6e B à un endroit
 * où elle n'est pas.
 *
 * `initial` sert aux écrans qui savent d'où reprendre — la saisie en lot lit
 * la classe du lien, sinon la dernière ouverte, parce que l'éducateur en
 * enchaîne trente et qu'un retour à la première lui coûte un geste à chaque
 * fois. Ce souvenir reste chez lui : il n'a rien à faire ici.
 */
export function useClassChoice(initial?: number) {
  const { data, isLoading } = useClasses({ size: 200 })

  const classes = useMemo(
    () => [...(data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  )

  const [choisie, setClassId] = useState<number | undefined>(initial)

  return {
    classes,
    // La première tant que rien n'est choisi : un écran qui s'ouvre vide
    // demande un geste avant de rien montrer, et ces deux écrans-là sont
    // ouverts debout, entre deux élèves.
    classId: choisie ?? classes[0]?.id,
    setClassId,
    isLoading,
  }
}
