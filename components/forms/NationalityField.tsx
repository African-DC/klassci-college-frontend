"use client"

import type { Control, FieldValues, Path } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface NationalityFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  /** Vide = `null` (formulaires d'inscription) ou `""` (fiche élève). */
  emptyAs?: null | ""
}

/**
 * La nationalité, en toutes lettres (« Ivoirienne », « Burkinabè »).
 *
 * Un champ libre plutôt qu'une liste : l'école l'écrit comme sur l'extrait de
 * naissance, et une liste de deux cents pays se parcourt mal au pouce.
 */
export function NationalityField<T extends FieldValues>({
  control,
  name,
  emptyAs = null,
}: NationalityFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nationalité</FormLabel>
          <FormControl>
            <Input
              placeholder="Ex : Ivoirienne"
              className="h-11"
              maxLength={60}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || emptyAs)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
