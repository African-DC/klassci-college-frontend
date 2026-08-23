"use client"

/**
 * Ce qu'on montre à la place du formulaire de créneau sur un téléphone.
 *
 * Poser un créneau, c'est croiser une matière, un enseignant, sa semaine, une
 * salle et un horaire. Sur un écran de cinq pouces, la semaine de l'enseignant
 * se réduit à une liste qu'il faut faire défiler sur six jours pour savoir si
 * l'heure visée est libre — et on décide sans voir. Mieux vaut le dire que
 * laisser essayer : l'emploi du temps se construit une fois par an, au
 * secrétariat, devant un vrai écran.
 *
 * La consultation, elle, reste ouverte partout : c'est elle qu'on fait au
 * quotidien, souvent debout dans une cour.
 */

import { MonitorSmartphone } from "lucide-react"

export function EcranTropPetit() {
  return (
    <div className="space-y-3 py-2 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <MonitorSmartphone className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium">Écran trop petit pour poser un créneau</p>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">
        Ajouter ou modifier un créneau demande de voir la semaine entière de l&apos;enseignant
        pendant qu&apos;on choisit l&apos;heure. Reprenez sur une tablette ou un ordinateur.
      </p>
      <p className="text-xs text-muted-foreground">
        La consultation de l&apos;emploi du temps reste disponible ici.
      </p>
    </div>
  )
}
