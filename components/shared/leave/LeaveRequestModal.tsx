"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LeaveCreateSchema, LEAVE_TYPE_OPTIONS, type LeaveCreate } from "@/lib/contracts/leave"
import { useCreateLeaveRequest } from "@/lib/hooks/useLeave"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

interface LeaveRequestModalProps {
  open: boolean
  onClose: () => void
}

export function LeaveRequestModal({ open, onClose }: LeaveRequestModalProps) {
  const form = useForm<LeaveCreate>({
    resolver: zodResolver(LeaveCreateSchema),
    defaultValues: { leave_type: "annual", start_date: "", end_date: "", reason: "" },
  })
  const { mutate, isPending, error } = useCreateLeaveRequest()

  const onSubmit = (data: LeaveCreate) => {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Demander un congé</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leave_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de congé *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEAVE_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <FormLabel>Du *</FormLabel>
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
                    <FormLabel>Au *</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Précisez le motif si nécessaire…"
                      className="min-h-20"
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

            <Button type="submit" size="lg" className="h-11 w-full font-semibold" disabled={isPending}>
              {isPending ? "Envoi…" : "Envoyer la demande"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
