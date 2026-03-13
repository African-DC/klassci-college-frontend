"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { EvaluationCreateSchema, type EvaluationCreate } from "@/lib/contracts/grade"
import { useCreateEvaluation } from "@/lib/hooks/useGrades"
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

const EVALUATION_TYPES = [
  { value: "devoir", label: "Devoir" },
  { value: "interro", label: "Interrogation" },
  { value: "examen", label: "Examen" },
  { value: "composition", label: "Composition" },
] as const

interface GradeEntryFormProps {
  classId?: number
  onSuccess: () => void
}

export function GradeEntryForm({ classId, onSuccess }: GradeEntryFormProps) {
  const form = useForm<EvaluationCreate>({
    resolver: zodResolver(EvaluationCreateSchema),
    defaultValues: {
      title: "",
      date: "",
      coefficient: 1,
      class_id: classId,
    },
  })

  const { mutate, isPending, error } = useCreateEvaluation()

  function onSubmit(data: EvaluationCreate) {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Devoir n1 - Mathematiques" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Type d'evaluation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EVALUATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="coefficient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coefficient *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
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
            name="subject_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matiere *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ID matiere"
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
        </div>

        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classe *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="ID classe"
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

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending}>
          {isPending ? "Creation..." : "Creer l'evaluation"}
        </Button>
      </form>
    </Form>
  )
}
