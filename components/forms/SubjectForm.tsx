"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubjectCreateSchema, type SubjectCreate } from "@/lib/contracts/subject"
import { useCreateSubject } from "@/lib/hooks/useSubjects"
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

interface SubjectFormProps {
  onSuccess: () => void
}

export function SubjectForm({ onSuccess }: SubjectFormProps) {
  const form = useForm<SubjectCreate>({
    resolver: zodResolver(SubjectCreateSchema),
    defaultValues: {
      name: "",
      coefficient: 1,
      hours_per_week: 1,
    },
  })

  const { mutate, isPending, error } = useCreateSubject()

  function onSubmit(data: SubjectCreate) {
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="coefficient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coefficient *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    className="h-11"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hours_per_week"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heures / semaine *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    className="h-11"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer la matière"}
        </Button>
      </form>
    </Form>
  )
}
