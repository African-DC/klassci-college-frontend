"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RoomUpdateSchema, type RoomUpdate, ROOM_TYPES } from "@/lib/contracts/room"
import { useRoom, useUpdateRoom } from "@/lib/hooks/useRooms"
import { useClasses } from "@/lib/hooks/useClasses"
import { useQueryClient } from "@tanstack/react-query"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

function EditForm({ roomId, onClose }: { roomId: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: roomData, isLoading } = useRoom(roomId)
  const { mutate, isPending, error } = useUpdateRoom(roomId)
  const { data: classesData } = useClasses({ size: 100 })

  const availableClasses = classesData?.items?.filter(
    (c) => !c.room_id || c.room_id === roomId
  ) ?? []

  const form = useForm<RoomUpdate>({
    resolver: zodResolver(RoomUpdateSchema),
    values: roomData
      ? {
          name: roomData.name,
          capacity: roomData.capacity ?? undefined,
          room_type: roomData.room_type ?? "classroom",
          class_id: roomData.class_id ?? undefined,
        }
      : undefined,
  })

  const watchRoomType = form.watch("room_type")
  const isClassroom = watchRoomType === "classroom"

  // When switching away from classroom, clear class_id
  useEffect(() => {
    if (!isClassroom) {
      form.setValue("class_id", undefined)
    }
  }, [isClassroom, form])

  if (isLoading || !roomData) return <EditFormSkeleton />

  function onSubmit(data: RoomUpdate) {
    const payload = { ...data }
    if (!isClassroom) {
      payload.class_id = null
    }
    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["classes"] })
        onClose()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="room_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de salle</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "classroom"}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Type de salle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROOM_TYPES.map((t) => (
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

        {/* Class select — only for classroom type */}
        {isClassroom && (
          <FormField
            control={form.control}
            name="class_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classe assignée</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                  value={field.value?.toString() ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Aucune classe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Aucune classe</SelectItem>
                    {availableClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} {c.level_name ? `(${c.level_name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        {/* Capacity — only for non-classroom types (classroom inherits from class) */}
        {!isClassroom && (
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacité</FormLabel>
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
        )}

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
