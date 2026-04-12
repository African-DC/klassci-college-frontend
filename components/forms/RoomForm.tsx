"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RoomCreateSchema, type RoomCreate, ROOM_TYPES } from "@/lib/contracts/room"
import { useCreateRoom } from "@/lib/hooks/useRooms"
import { useClasses } from "@/lib/hooks/useClasses"
import { useQueryClient } from "@tanstack/react-query"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RoomFormProps {
  onSuccess: () => void
}

export function RoomForm({ onSuccess }: RoomFormProps) {
  const queryClient = useQueryClient()
  const form = useForm<RoomCreate>({
    resolver: zodResolver(RoomCreateSchema),
    defaultValues: {
      name: "",
      capacity: undefined,
      room_type: "classroom",
      class_id: undefined,
    },
  })

  const { data: classesData } = useClasses({ size: 100 })
  // Only show classes without a room already assigned
  const availableClasses = classesData?.items?.filter((c) => !c.room_id) ?? []

  const { mutate, isPending, error } = useCreateRoom()

  const selectedClassId = form.watch("class_id")

  // Auto-fill name + capacity when selecting a class
  useEffect(() => {
    if (selectedClassId) {
      const cls = availableClasses.find((c) => c.id === selectedClassId)
      if (cls) {
        const currentName = form.getValues("name")
        if (!currentName || currentName.startsWith("Salle ")) {
          form.setValue("name", `Salle ${cls.name}`)
        }
        if (!form.getValues("capacity") && cls.max_students) {
          form.setValue("capacity", cls.max_students)
        }
      }
    }
  }, [selectedClassId])

  function onSubmit(data: RoomCreate) {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        queryClient.invalidateQueries({ queryKey: ["classes"] })
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Class assignment */}
        {availableClasses.length > 0 && (
          <FormField
            control={form.control}
            name="class_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigner à une classe</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "none" ? undefined : Number(v))}
                  value={field.value?.toString() ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Aucune classe (salle indépendante)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Aucune (labo, salle info, etc.)</SelectItem>
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
              <FormLabel>Nom de la salle *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Salle 101, Labo Physique" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                    placeholder="Ex : 45"
                    className="h-11"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    value={field.value ?? ""}
                  />
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
          {isPending ? "Enregistrement..." : "Enregistrer la salle"}
        </Button>
      </form>
    </Form>
  )
}
