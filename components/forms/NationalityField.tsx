"use client"

import type { Control, FieldValues, Path } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ComboboxCreate } from "@/components/shared/ComboboxCreate"
import { NATIONALITIES, NATIONALITY_ALIASES } from "@/lib/constants/nationalities"

interface NationalityFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  disabled?: boolean
}

/**
 * La nationalité, en toutes lettres (« Ivoirienne », « Burkinabè »).
 *
 * Recherche rapide parmi les nationalités usuelles, y compris par nom de pays.
 * Les libellés historiques ou moins courants restent acceptés par saisie libre.
 */
export function NationalityField<T extends FieldValues>({
  control,
  name,
  disabled,
}: NationalityFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nationalité</FormLabel>
          <FormControl>
            <ComboboxCreate
              options={[...NATIONALITIES]}
              value={field.value ?? ""}
              onChange={(value) => field.onChange(value || null)}
              placeholder="Choisir une nationalité"
              searchPlaceholder="Rechercher une nationalité ou un pays…"
              searchAliases={NATIONALITY_ALIASES}
              customActionLabel="Utiliser"
              allowClear
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
