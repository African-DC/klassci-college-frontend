"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AcademicYearUpdateSchema, type AcademicYearUpdate } from "@/lib/contracts/academic-year"
import { useAcademicYear, useUpdateAcademicYear } from "@/lib/hooks/useAcademicYears"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

function EditFormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

function EditForm({ yearId, onClose }: { yearId: number; onClose: () => void }) {
  const { data: yearData, isLoading } = useAcademicYear(yearId)
  const { mutate, isPending, error } = useUpdateAcademicYear(yearId)

  const form = useForm<AcademicYearUpdate>({
    resolver: zodResolver(AcademicYearUpdateSchema),
    values: yearData
      ? {
          name: yearData.name,
          start_date: yearData.start_date,
          end_date: yearData.end_date,
        }
      : undefined,
  })

  if (isLoading || !yearData) return <EditFormSkeleton />

  function onSubmit(data: AcademicYearUpdate) {
    mutate(data, { onSuccess: onClose })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input className="h-11" placeholder="2025-2026" {...field} value={field.value ?? ""} />
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
                <FormLabel>Date de debut</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11" {...field} value={field.value ?? ""} />
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
                <FormLabel>Date de fin</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11" {...field} value={field.value ?? ""} />
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
          {isPending ? "Enregistrement..." : "Mettre a jour"}
        </Button>
      </form>
    </Form>
  )
}

interface AcademicYearEditModalProps {
  yearId: number | null
  open: boolean
  onClose: () => void
}

export function AcademicYearEditModal({ yearId, open, onClose }: AcademicYearEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;annee academique</DialogTitle>
        </DialogHeader>
        {yearId && <EditForm yearId={yearId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
