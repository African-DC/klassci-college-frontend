"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SeriesCreateSchema, type SeriesCreate } from "@/lib/contracts/series"
import { useCreateSeries } from "@/lib/hooks/useSeries"
import { useLevels } from "@/lib/hooks/useLevels"
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

interface SeriesFormProps {
  onSuccess: () => void
}

export function SeriesForm({ onSuccess }: SeriesFormProps) {
  const form = useForm<SeriesCreate>({
    resolver: zodResolver(SeriesCreateSchema),
    defaultValues: {
      name: "",
      level_id: undefined,
    },
  })

  const { data: levelsData } = useLevels()
  const levels = levelsData?.items
  const { mutate, isPending, error } = useCreateSeries()

  function onSubmit(data: SeriesCreate) {
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
              <FormLabel>Nom de la serie *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : A, C, D" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="level_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Niveau *</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value?.toString() ?? ""}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selectionner un niveau" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          {isPending ? "Enregistrement..." : "Enregistrer la serie"}
        </Button>
      </form>
    </Form>
  )
}
