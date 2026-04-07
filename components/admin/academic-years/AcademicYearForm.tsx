"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AcademicYearCreateSchema, type AcademicYearCreate } from "@/lib/contracts/academic-year"
import { useCreateAcademicYear } from "@/lib/hooks/useAcademicYears"
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

interface AcademicYearFormProps {
  onSuccess: () => void
}

export function AcademicYearForm({ onSuccess }: AcademicYearFormProps) {
  const form = useForm<AcademicYearCreate>({
    resolver: zodResolver(AcademicYearCreateSchema),
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
      is_current: false,
    },
  })

  const { mutate, isPending, error } = useCreateAcademicYear()

  function onSubmit(data: AcademicYearCreate) {
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
              <FormLabel>Nom *</FormLabel>
              <FormControl>
                <Input className="h-11" placeholder="2025-2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de debut *</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de fin *</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11" {...field} />
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
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Form>
  )
}
