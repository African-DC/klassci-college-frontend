"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { timetableSlotSchema, type TimetableSlotInput } from "@/lib/validators/timetable"
import { useCreateSlot } from "@/lib/hooks/useTimetable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const DAYS = [
  { value: "lundi", label: "Lundi" },
  { value: "mardi", label: "Mardi" },
  { value: "mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "vendredi", label: "Vendredi" },
] as const

interface TimetableSlotFormProps {
  defaultDay?: string
  defaultStartTime?: string
  classId?: number
  onSuccess: () => void
}

export function TimetableSlotForm({
  defaultDay,
  defaultStartTime,
  classId,
  onSuccess,
}: TimetableSlotFormProps) {
  const form = useForm<TimetableSlotInput>({
    resolver: zodResolver(timetableSlotSchema),
    defaultValues: {
      day: defaultDay as TimetableSlotInput["day"] | undefined,
      start_time: defaultStartTime ?? "",
      end_time: "",
      class_id: classId,
      room: "",
    },
  })

  const { mutate, isPending, error } = useCreateSlot()

  function onSubmit(data: TimetableSlotInput) {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="teacher_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enseignant *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ID enseignant"
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
            name="subject_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matiere *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ID matiere"
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
        </div>

        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classe *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="ID classe"
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

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jour *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Jour" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
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
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Debut *</FormLabel>
                <FormControl>
                  <Input type="time" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fin *</FormLabel>
                <FormControl>
                  <Input type="time" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="room"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salle</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Salle 201" className="h-11" {...field} />
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
          {isPending ? "Enregistrement..." : "Ajouter le creneau"}
        </Button>
      </form>
    </Form>
  )
}
