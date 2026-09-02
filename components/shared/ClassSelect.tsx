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
  id,
}: {
  classes: Class[]
  value: number | undefined
  onChange: (classId: number) => void
  isLoading?: boolean
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
            disabled={classes.length === 0}
          >
            <SelectTrigger id={id} className="mt-1 h-11 sm:h-10">
              <SelectValue
                placeholder={classes.length === 0 ? "Aucune classe" : "Choisir une classe"}
              />
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
