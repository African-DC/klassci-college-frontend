"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  enrollmentCreateSchema,
  type EnrollmentCreateInput,
} from "@/lib/validators/enrollment"
import { useCreateEnrollment } from "@/lib/hooks/useEnrollments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface EnrollmentFormProps {
  onSuccess: () => void
}

export function EnrollmentForm({ onSuccess }: EnrollmentFormProps) {
  const form = useForm<EnrollmentCreateInput>({
    resolver: zodResolver(enrollmentCreateSchema),
    defaultValues: {
      is_scholarship: false,
    },
  })

  const { mutate, isPending, error } = useCreateEnrollment()

  function onSubmit(data: EnrollmentCreateInput) {
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
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eleve *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="ID de l'eleve"
                  className="h-11"
                  {...field}
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
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classe *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="ID de la classe"
                  className="h-11"
                  {...field}
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
          name="academic_year_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Annee academique *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="ID de l'annee academique"
                  className="h-11"
                  {...field}
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
          name="assignment_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut d&apos;affectation *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="affecte">Affecte</SelectItem>
                  <SelectItem value="reaffecte">Reaffecte</SelectItem>
                  <SelectItem value="non_affecte">Non affecte</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_scholarship"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                Eleve boursier
              </FormLabel>
            </FormItem>
          )}
        />

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full h-11 font-semibold"
          disabled={isPending}
        >
          {isPending ? "Enregistrement..." : "Enregistrer l'inscription"}
        </Button>
      </form>
    </Form>
  )
}
