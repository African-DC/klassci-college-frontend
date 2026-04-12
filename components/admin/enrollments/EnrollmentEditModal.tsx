"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { EnrollmentUpdateSchema, type EnrollmentUpdate } from "@/lib/contracts/enrollment"
import { useEnrollment, useUpdateEnrollment } from "@/lib/hooks/useEnrollments"
import { useClasses } from "@/lib/hooks/useClasses"
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
  const { data: classesData, isLoading: classesLoading } = useClasses({ size: 200 })

  const classes = classesData?.items ?? []

  const form = useForm<EnrollmentUpdate>({
    resolver: zodResolver(EnrollmentUpdateSchema),
    values: enrollment
      ? {
          class_id: enrollment.class_id,
          status: enrollment.status,
          notes: enrollment.notes,
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
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={field.value?.toString()}
                disabled={classesLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="en_validation">En validation</SelectItem>
                  <SelectItem value="valide">Validé</SelectItem>
                  <SelectItem value="rejete">Rejeté</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input
                  className="h-11"
                  placeholder="Notes optionnelles"
                  {...field}
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

        <Button
          type="submit"
          size="lg"
          className="w-full h-11 font-semibold"
          disabled={isPending}
        >
          {isPending ? "Mise à jour..." : "Mettre à jour"}
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
