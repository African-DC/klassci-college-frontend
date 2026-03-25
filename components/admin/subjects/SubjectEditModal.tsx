"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubjectUpdateSchema, type SubjectUpdate } from "@/lib/contracts/subject"
import { useSubject, useUpdateSubject } from "@/lib/hooks/useSubjects"
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

function EditForm({ subjectId, onClose }: { subjectId: number; onClose: () => void }) {
  const { data: subject, isLoading } = useSubject(subjectId)
  const { mutate, isPending, error } = useUpdateSubject(subjectId)

  const form = useForm<SubjectUpdate>({
    resolver: zodResolver(SubjectUpdateSchema),
    values: subject
      ? {
          name: subject.name,
          code: subject.code,
          coefficient: subject.coefficient,
          level: subject.level ?? undefined,
          category: subject.category ?? undefined,
        }
      : undefined,
  })

  if (isLoading || !subject) return <EditFormSkeleton />

  function onSubmit(data: SubjectUpdate) {
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
              <FormLabel>Nom de la matière</FormLabel>
              <FormControl>
                <Input className="h-11" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input className="h-11" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="coefficient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coefficient</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau</FormLabel>
                <FormControl>
                  <Input className="h-11" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <FormControl>
                  <Input className="h-11" {...field} value={field.value ?? ""} />
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
          {isPending ? "Enregistrement..." : "Mettre à jour"}
        </Button>
      </form>
    </Form>
  )
}

interface SubjectEditModalProps {
  subjectId: number | null
  open: boolean
  onClose: () => void
}

export function SubjectEditModal({ subjectId, open, onClose }: SubjectEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier la matière</DialogTitle>
        </DialogHeader>
        {subjectId && <EditForm subjectId={subjectId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
