"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RoomUpdateSchema, type RoomUpdate } from "@/lib/contracts/room"
import { useRoom, useUpdateRoom } from "@/lib/hooks/useRooms"
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
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

function EditForm({ roomId, onClose }: { roomId: number; onClose: () => void }) {
  const { data: roomData, isLoading } = useRoom(roomId)
  const { mutate, isPending, error } = useUpdateRoom(roomId)

  const form = useForm<RoomUpdate>({
    resolver: zodResolver(RoomUpdateSchema),
    values: roomData
      ? {
          name: roomData.name,
          capacity: roomData.capacity ?? undefined,
        }
      : undefined,
  })

  if (isLoading || !roomData) return <EditFormSkeleton />

  function onSubmit(data: RoomUpdate) {
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
              <FormLabel>Nom de la salle</FormLabel>
              <FormControl>
                <Input className="h-11" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacite</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  className="h-11"
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
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
          {isPending ? "Enregistrement..." : "Mettre a jour"}
        </Button>
      </form>
    </Form>
  )
}

interface RoomEditModalProps {
  roomId: number | null
  open: boolean
  onClose: () => void
}

export function RoomEditModal({ roomId, open, onClose }: RoomEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier la salle</DialogTitle>
        </DialogHeader>
        {roomId && <EditForm roomId={roomId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
