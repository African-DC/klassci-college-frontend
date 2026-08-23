"use client"

/**
 * Le trio jour / début / fin, et ce qui l'empêche.
 *
 * Extrait du formulaire de créneau, qui passait la limite de taille en
 * gagnant sa deuxième colonne. Ces trois champs vont ensemble : ils décrivent
 * un même moment, et la bannière qui les suit dit pourquoi ce moment est
 * refusé. Les séparer les uns des autres n'aurait servi qu'à respecter un
 * compteur de lignes.
 *
 * Ils restent la voie du clavier : la grille se trace à la souris ou au doigt,
 * ces listes se remplissent à la tabulation.
 */

import { AlertTriangle } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import type { TimetableSlotCreate } from "@/lib/contracts/timetable"
import type { Empechement } from "@/lib/timetable/week-overlap"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const DAYS = [
  { value: "lundi", label: "Lundi" },
  { value: "mardi", label: "Mardi" },
  { value: "mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "vendredi", label: "Vendredi" },
  { value: "samedi", label: "Samedi" },
] as const

interface Props {
  form: UseFormReturn<TimetableSlotCreate>
  empechement: Empechement | null
  /** L'erreur du serveur prime : inutile d'annoncer deux fois le même refus. */
  erreurServeur: boolean
}

export function ChampsDuCreneau({ form, empechement, erreurServeur }: Props) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jour *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Jour" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Début *</FormLabel>
              <FormControl>
                <Input type="time" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fin *</FormLabel>
              <FormControl>
                <Input type="time" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {empechement && !erreurServeur && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Créneau impossible</p>
            <p className="text-sm text-muted-foreground">{empechement.message}</p>
          </div>
        </div>
      )}
    </>
  )
}
