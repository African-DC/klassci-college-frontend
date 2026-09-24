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
import { AssignmentStatusField } from "@/components/forms/AssignmentStatusField"
import { NewStudentChoiceGroup } from "@/components/forms/NewStudentChoiceGroup"

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
  const { data: classesData, isLoading: classesLoading } = useClasses({ size: 100 })

  const classes = classesData?.items ?? []

  const form = useForm<EnrollmentUpdate>({
    resolver: zodResolver(EnrollmentUpdateSchema),
    values: enrollment
      ? {
          class_id: enrollment.class_id,
          status: enrollment.status,
          assignment_status: enrollment.assignment_status ?? null,
          assignment_decision_number: enrollment.assignment_decision_number ?? null,
          is_new_student: enrollment.is_new_student ?? null,
          notes: enrollment.notes,
        }
      : undefined,
  })

  // La décision d'affectation arrive parfois après l'inscription : on suit la
  // valeur en direct pour révéler le numéro de décision dès qu'il devient utile.
  const assignmentStatus = form.watch("assignment_status")
  // Le profil décide des frais réservés aux nouveaux ou aux anciens : le
  // changer les recalcule. On le dit dès qu'il change, pas après l'envoi.
  const profil = form.watch("is_new_student")
  const profilChange = enrollment !== undefined && (profil ?? null) !== (enrollment.is_new_student ?? null)

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
          name="is_new_student"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profil de l&apos;élève</FormLabel>
              <NewStudentChoiceGroup
                value={field.value ?? null}
                onChange={field.onChange}
                allowUndecided
                disabled={isPending}
              />
              {profilChange ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  Les frais réservés aux nouveaux ou aux anciens élèves (chemise, RAM…) seront
                  recalculés. Ceux déjà payés ou déposés ne changent pas.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Première année dans KLASSCI : un élève déjà présent dans l&apos;école avant est
                  « déjà inscrit ici avant ».
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <AssignmentStatusField
          control={form.control}
          statusName="assignment_status"
          decisionName="assignment_decision_number"
          status={assignmentStatus}
          onDecisionCleared={() => form.setValue("assignment_decision_number", null)}
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
