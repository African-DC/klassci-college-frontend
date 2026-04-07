"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RoomCreateSchema, type RoomCreate } from "@/lib/contracts/room"
import { useCreateRoom } from "@/lib/hooks/useRooms"
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

interface RoomFormProps {
  onSuccess: () => void
}

export function RoomForm({ onSuccess }: RoomFormProps) {
  const form = useForm<RoomCreate>({
    resolver: zodResolver(RoomCreateSchema),
    defaultValues: {
      name: "",
      capacity: undefined,
    },
  })

  const { mutate, isPending, error } = useCreateRoom()

  function onSubmit(data: RoomCreate) {
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
              <FormLabel>Nom de la salle *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Salle 101, Labo Physique" className="h-11" {...field} />
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
