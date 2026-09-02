"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Class } from "@/lib/contracts/class"

/**
 * Ce que dit le champ quand il ne propose rien.
 *
 * « Aucune classe » sur une liste qu'on n'a pas pu lire est un mensonge, et
 * c'est exactement celui qui a cache pendant des semaines un ecran inutilisable :
 * le selecteur affichait son invite, et l'ecran concluait « aucune inscription ».
 */
function placeholder(nombre: number, isError?: boolean): string {
  if (isError) return "Liste des classes indisponible"
  if (nombre === 0) return "Aucune classe enregistrée"
  return "Choisir une classe"
}

/**
 * Le choix de la classe, tel qu'il se présente sur les écrans qui en dépendent.
 *
 * La saisie en lot et les soldes le dessinaient chacun de leur côté, à deux
 * hauteurs de cible et deux états de chargement différents. Le même geste, au
 * même endroit de la page, ne doit pas répondre différemment selon l'écran.
 *
 * Cible à `h-11` sur téléphone : ces deux écrans se tiennent debout, dans une
 * cour ou au guichet, et 44 points est le minimum pour un pouce.
 */
export function ClassSelect({
  classes,
  value,
  onChange,
  isLoading,
  isError,
  id,
}: {
  classes: Class[]
  value: number | undefined
  onChange: (classId: number) => void
  isLoading?: boolean
  /** La liste n'a pas pu etre lue : le dire, plutot que « aucune classe ». */
  isError?: boolean
  /** Distinct par écran : deux `id` identiques sur une page casseraient le label. */
  id: string
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-4">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          Classe
        </Label>
        {isLoading ? (
          <Skeleton className="mt-1 h-11 w-full" />
        ) : (
          <Select
            value={value ? String(value) : undefined}
            onValueChange={(v) => onChange(Number(v))}
            disabled={classes.length === 0 || Boolean(isError)}
          >
            <SelectTrigger id={id} className="mt-1 h-11 sm:h-10">
              <SelectValue placeholder={placeholder(classes.length, isError)} />
            </SelectTrigger>
            <SelectContent>
              {classes.map((classe) => (
                <SelectItem key={classe.id} value={String(classe.id)} className="py-2.5">
                  {classe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  )
}
