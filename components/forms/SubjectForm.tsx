"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCreateSubject } from "@/lib/hooks/useSubjects"
import { SUBJECT_COLOR_PALETTE } from "@/lib/contracts/subject"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const CatalogueSubjectSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  color: z.string().default("blue"),
  coefficient: z.number().default(1),
  hours_per_week: z.number().default(1),
})

type CatalogueSubject = z.infer<typeof CatalogueSubjectSchema>

interface SubjectFormProps {
  onSuccess: () => void
}

export function SubjectForm({ onSuccess }: SubjectFormProps) {
  const form = useForm<CatalogueSubject>({
    resolver: zodResolver(CatalogueSubjectSchema),
    defaultValues: {
      name: "",
      color: "blue",
      coefficient: 1,
      hours_per_week: 1,
    },
  })

  const { mutate, isPending, error } = useCreateSubject()

  function onSubmit(data: CatalogueSubject) {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la matière *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Mathématiques" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur</FormLabel>
              <div className="grid grid-cols-6 gap-2">
                {SUBJECT_COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-all ${c.class} ${
                      field.value === c.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                    title={c.label}
                    onClick={() => field.onChange(c.value)}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-xs text-muted-foreground">
          Le coefficient et les heures/semaine seront configurés lors de l'assignation à un niveau.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Ajouter au catalogue"}
        </Button>
      </form>
    </Form>
  )
}
