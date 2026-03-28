"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { EnrollmentUpdateSchema, type EnrollmentUpdate } from "@/lib/contracts/enrollment"
import { useEnrollment, useUpdateEnrollment } from "@/lib/hooks/useEnrollments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface EnrollmentEditModalProps {
  enrollmentId: number | null
  open: boolean
  onClose: () => void
}

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

function EditForm({ enrollmentId, onClose }: { enrollmentId: number; onClose: () => void }) {
  const { data: enrollment, isLoading } = useEnrollment(enrollmentId)
  const { mutate, isPending, error } = useUpdateEnrollment(enrollmentId)

  const form = useForm<EnrollmentUpdate>({
    resolver: zodResolver(EnrollmentUpdateSchema),
    values: enrollment
      ? {
          class_id: enrollment.class_id,
          assignment_status: enrollment.assignment_status,
          is_scholarship: enrollment.is_scholarship,
        }
      : undefined,
  })

  if (isLoading || !enrollment) return <EditFormSkeleton />

  function onSubmit(data: EnrollmentUpdate) {
    mutate(data, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classe</FormLabel>
              <FormControl>
                <Input
                  type="number"
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
              <FormLabel>Statut d&apos;affectation</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
                  checked={field.value ?? false}
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
          {isPending ? "Mise a jour..." : "Mettre a jour"}
        </Button>
      </form>
    </Form>
  )
}

export function EnrollmentEditModal({ enrollmentId, open, onClose }: EnrollmentEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;inscription</DialogTitle>
        </DialogHeader>
        {enrollmentId && <EditForm enrollmentId={enrollmentId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
